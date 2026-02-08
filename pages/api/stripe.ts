// FILE: /pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getStripeClient } from "../../lib/stripe";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../lib/payoutSettings";
import {
  sendOrderConfirmationEmail,
  sendSellerSoldShipNowEmail,
  OrderEmailPayload,
} from "../../utils/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn(
    "[stripe webhook] STRIPE_WEBHOOK_SECRET is not set – webhook verification will fail."
  );
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return await new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed" });
    return;
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase Admin is not configured" });
  }

  let event: Stripe.Event;

  try {
    const buf = await getRawBody(req);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing Stripe signature header");
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const listingId = session.metadata?.listingId;
        const paymentStatus = session.payment_status;

        if (!listingId || paymentStatus !== "paid") break;

        const listingRef = adminDb.collection("listings").doc(listingId);
        const listingSnap = await listingRef.get();
        const listing = listingSnap.data() || {};
        const buyerUid = session.metadata?.buyerId || null;
        const listingImage =
          listing.displayImageUrl ||
          listing.display_image_url ||
          listing.imageUrl ||
          listing.image_url ||
          (Array.isArray(listing.images) ? listing.images[0] : "");

        // Mark listing as Sold
        await listingRef.update({
          status: "Sold",
          updatedAt: FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent || null,
        });

        // Create order record
        const metadata = session.metadata || {};
        const buyerEmail = session.customer_details?.email || metadata.buyerEmail || "";
        const buyerName = session.customer_details?.name || metadata.buyerName || "";

        // Treat shipping_details as a plain object type.
        const shippingDetails = (session as any).shipping_details as
          | { name?: string; address?: any }
          | undefined;

        const metadataAddress = {
          line1: metadata.shipLine1 || "",
          line2: metadata.shipLine2 || "",
          city: metadata.shipCity || "",
          state: metadata.shipState || "",
          postal_code: metadata.shipPostal || "",
          country: metadata.shipCountry || "",
        };

        let shipAddr =
          shippingDetails?.address || session.customer_details?.address || null;

        if (!shipAddr && Object.values(metadataAddress).some(Boolean)) {
          shipAddr = metadataAddress;
        }

        const buyerShippingAddress = shipAddr
          ? {
              name: shippingDetails?.name || buyerName || "",
              line1: shipAddr.line1 || "",
              line2: shipAddr.line2 || "",
              city: shipAddr.city || "",
              state: shipAddr.state || "",
              postal_code: shipAddr.postal_code || "",
              country: shipAddr.country || "",
            }
          : null;

        const currency = (session.currency || "usd").toUpperCase();
        const amountTotal = (session.amount_total || 0) / 100;
        const subtotal = (session.amount_subtotal || amountTotal) / 100;
        const shipping = Math.max(0, amountTotal - subtotal);

        const { defaultCoolingDays } = await getPayoutSettings();

        // Default ship deadline: 72 hours from payment
        const shipDeadlineAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

        const ordersRef = adminDb.collection("orders");
        const orderDoc = {
          listingId,
          listingTitle: listing.title || "Product",
          listingBrand: listing.brand || "",
          listingCategory: listing.category || "",
          price: listing.price || amountTotal,
          total: amountTotal,
          priceLabel: amountTotal
            ? `${amountTotal.toLocaleString("en-US", {
                style: "currency",
                currency,
              })}`
            : "",
          currency,
          buyerEmail,
          buyerName,
          buyerUid,
          sellerId: listing.sellerId || null,
          sellerName:
            listing.sellerName || listing.sellerDisplayName || "Independent seller",
          listingImage: listingImage || "",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,

          // IMPORTANT: for seller UI filters
          status: "Paid",

          fulfillment: {
            stage: "PAID",
            signatureRequired: true,
          },

          shippingAddress: buyerShippingAddress,

          shipDeadlineAt,

          payout: {
            coolingDays: defaultCoolingDays,
            status: "NOT_READY", // NOT_READY | COOLING | ELIGIBLE | PAID
          },

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        const orderRef = await ordersRef.add(orderDoc);
        const orderId = orderRef.id;

        // Email seller with shipping instructions
        try {
          const sellerId = String(listing.sellerId || "");
          if (sellerId) {
            const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
            const sellerData: any = sellerDoc.exists ? sellerDoc.data() : null;
            const sellerEmail = String(
              sellerData?.email || sellerData?.contactEmail || sellerId || ""
            );

            if (sellerEmail.includes("@")) {
              const sa: any = buyerShippingAddress;
              const shippingAddressText = sa
                ? `${sa.name || buyerName || ""}\n${sa.line1 || ""}${
                    sa.line2 ? `, ${sa.line2}` : ""
                  }\n${[sa.city, sa.state, sa.postal_code]
                    .filter(Boolean)
                    .join(" ")}\n${sa.country || ""}`
                : "Address not provided";

              await sendSellerSoldShipNowEmail({
                to: sellerEmail,
                orderId,
                listingTitle: listing.title || "Item",
                buyerName,
                buyerEmail,
                shippingAddressText,
                shipByText: "within 72 hours",
              });
            }
          }
        } catch (sellerEmailErr) {
          console.warn("Failed to send seller sold email:", sellerEmailErr);
        }

        // Send email receipt to buyer
        if (buyerEmail) {
          const emailPayload: OrderEmailPayload = {
            id: orderId,
            customerName: buyerName || undefined,
            customerEmail: buyerEmail,
            currency,
            items: [
              {
                name: listing.title || "Product",
                brand: listing.brand || "",
                category: listing.category || "",
                quantity: 1,
                price: subtotal || amountTotal,
              },
            ],
            subtotal: subtotal || amountTotal,
            shipping,
            total: amountTotal,
          };

          try {
            await sendOrderConfirmationEmail(emailPayload);
          } catch (emailErr) {
            console.error(
              "Failed to send order confirmation email:",
              (emailErr as any)?.message || emailErr
            );
          }
        }

        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook handler error:", err?.message || err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
