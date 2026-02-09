// FILE: /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getStripeClient } from "../../../lib/stripe";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import {
  sendSellerSoldShipNowEmail,
  sendOrderConfirmationEmail,
  OrderEmailPayload,
} from "../../../utils/email";
import { getPayoutSettings } from "../../../lib/payoutSettings";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const config = { api: { bodyParser: false } };

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return await new Promise((resolve, reject) => {
    req.on("data", (chunk) =>
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    );
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed" });
    return;
  }

  const stripe = await getStripeClient();
  if (!stripe) return res.status(500).json({ error: "Stripe is not configured" });
  if (!adminDb) return res.status(500).json({ error: "Firebase Admin is not configured" });

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);

    if (!webhookSecret) {
      return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured" });
    }

    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err?.message || err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ✅ Idempotency: if we already created an order for this Stripe session, no-op.
        const existingByTop = await adminDb
          .collection("orders")
          .where("stripeSessionId", "==", session.id)
          .limit(1)
          .get();
        if (!existingByTop.empty) break;

        // Back-compat: older order schema stores stripe.sessionId
        const existingByNested = await adminDb
          .collection("orders")
          .where("stripe.sessionId", "==", session.id)
          .limit(1)
          .get();
        if (!existingByNested.empty) break;

        const listingId = session.metadata?.listingId;
        const paymentStatus = session.payment_status;

        if (!listingId || paymentStatus !== "paid") break;

        // 1) Load listing
        const listingRef = adminDb.collection("listings").doc(listingId);
        const listingSnap = await listingRef.get();
        if (!listingSnap.exists) break;
        const listing: any = listingSnap.data() || {};

        const sellerId = String(listing.sellerId || "");
        const listingTitle = String(listing.title || listing.name || "Item");

        // 2) Mark listing sold
        await listingRef.set(
          {
            status: "Sold",
            isSold: true,
            soldAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            stripePaymentIntent: session.payment_intent || null,
          },
          { merge: true }
        );

        // 3) Extract buyer + shipping
        const buyerEmail = session.customer_details?.email || "";
        const buyerName = session.customer_details?.name || "";

        const shippingDetails = (session as any).shipping_details as
          | { name?: string; address?: any }
          | undefined;

        const shipAddr =
          shippingDetails?.address || session.customer_details?.address || null;

        const shippingAddress = shipAddr
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

        // 4) Create order record (canonical schema used by /order/success)
        const nowMs = Date.now();
        const shipDeadlineAt = new Date(nowMs + 72 * 60 * 60 * 1000);

        const currency = (session.currency || "usd").toUpperCase();
        const amountTotal = (session.amount_total || 0) / 100;
        const subtotal = (session.amount_subtotal || session.amount_total || 0) / 100;
        const shippingCost = Math.max(0, amountTotal - subtotal);

        const { defaultCoolingDays } = await getPayoutSettings();

        const orderRef = await adminDb.collection("orders").add({
          listingId,
          listingTitle,
          listingBrand: String(listing.brand || ""),
          listingCategory: String(listing.category || ""),
          sellerId,
          sellerName: String(
            listing.sellerName || listing.sellerDisplayName || "Independent seller"
          ),
          listingImage:
            listing.displayImageUrl ||
            listing.display_image_url ||
            listing.imageUrl ||
            listing.image_url ||
            (Array.isArray(listing.images) ? listing.images[0] : "") ||
            "",
          status: "Paid",
          buyerEmail,
          buyerName,
          buyerUid: session.metadata?.buyerId || null,
          shippingAddress,
          shipDeadlineAt,
          fulfillment: {
            stage: "PAID",
            signatureRequired: true,
          },
          payout: {
            status: "NOT_READY",
            coolingDays: defaultCoolingDays,
          },
          price: listing.price || amountTotal,
          total: amountTotal,
          currency,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          totals: { currency, total: amountTotal },
          stripe: { sessionId: session.id, paymentIntentId: session.payment_intent || null },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 5) Email seller with label details
        if (sellerId) {
          const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
          const sellerData: any = sellerDoc.exists ? sellerDoc.data() : null;
          const sellerEmail =
            (sellerData?.email || sellerData?.contactEmail || sellerId || "").toString();

          if (sellerEmail.includes("@")) {
            const shippingAddressText = shippingAddress
              ? `${shippingAddress.name}\n${shippingAddress.line1}${
                  shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""
                }\n${[shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
                  .filter(Boolean)
                  .join(" ")}\n${shippingAddress.country}`
              : "Address not provided";

            try {
              await sendSellerSoldShipNowEmail({
                to: sellerEmail,
                orderId: orderRef.id,
                listingTitle,
                buyerName,
                buyerEmail,
                shippingAddressText,
                shipByText: "within 72 hours",
              });
            } catch (e) {
              console.warn("Seller sold email failed:", e);
            }
          }
        }

        // 6) Email buyer receipt (best effort)
        if (buyerEmail) {
          const emailPayload: OrderEmailPayload = {
            id: orderRef.id,
            customerName: buyerName || undefined,
            customerEmail: buyerEmail,
            currency,
            items: [
              {
                name: listingTitle,
                brand: String(listing.brand || ""),
                category: String(listing.category || ""),
                quantity: 1,
                price: subtotal || amountTotal,
              },
            ],
            subtotal: subtotal || amountTotal,
            shipping: shippingCost,
            total: amountTotal,
          };

          try {
            await sendOrderConfirmationEmail(emailPayload);
          } catch (e) {
            console.warn("Buyer order email failed:", e);
          }
        }

        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook handler error:", err?.message || err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
