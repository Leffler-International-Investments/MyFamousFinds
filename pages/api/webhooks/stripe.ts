// FILE: /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getStripeClient } from "../../../lib/stripe";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendSellerSoldShipNowEmail } from "../../../utils/email";

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

  let event: Stripe.Event;

  try {
    const buf = await getRawBody(req);
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe signature header");
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

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
        await listingRef.update({
          status: "Sold",
          updatedAt: FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent || null,
        });

        // 3) Extract buyer + shipping
        const buyerEmail = session.customer_details?.email || "";
        const buyerName = session.customer_details?.name || "";

        // ✅ FIX: Stripe typings in your installed version do NOT export Session.ShippingDetails
        // Treat shipping_details as plain object type (safe).
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

        // 4) Create order record (seller label source)
        // Default ship deadline: 72 hours
        const nowMs = Date.now();
        const shipDeadlineAt = new Date(nowMs + 72 * 60 * 60 * 1000);

        const currency = (session.currency || "usd").toUpperCase();
        const total = (session.amount_total || 0) / 100;

        const orderRef = await adminDb.collection("orders").add({
          listingId,
          listingTitle,
          sellerId,
          status: "Paid", // Paid → Shipped → Delivered(Signature) → Confirmed → Cooling → PaidOut
          buyer: {
            name: buyerName,
            email: buyerEmail,
          },
          shippingAddress,
          shipDeadlineAt,
          fulfillment: {
            stage: "PAID",
            signatureRequired: true,
          },
          payout: {
            status: "NOT_READY",
            coolingDays: 7, // later adjustable via settings
          },
          totals: { currency, total },
          stripe: {
            sessionId: session.id,
            paymentIntentId: session.payment_intent || null,
          },
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
