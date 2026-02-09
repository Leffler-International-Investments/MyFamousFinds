// FILE: /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getStripeClient } from "../../../lib/stripe";

export const config = {
  api: { bodyParser: false },
};

async function readBuffer(req: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!adminDb) {
    console.error("[stripe webhook] Firebase not configured");
    return res.status(500).end();
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    console.error("[stripe webhook] Stripe not configured");
    return res.status(500).end();
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET missing");
    return res.status(500).end();
  }

  let event: Stripe.Event;

  try {
    const buf = await readBuffer(req);
    const sig = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe webhook] Signature verification failed:", err.message);
    return res.status(400).end("Invalid signature");
  }

  // ✅ IDEMPOTENCY
  const eventRef = adminDb.collection("stripe_events").doc(event.id);
  const alreadyHandled = await eventRef.get();
  if (alreadyHandled.exists) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  await eventRef.set({
    type: event.type,
    created: Date.now(),
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const listingId = session.metadata?.listingId;
      if (!listingId) {
        console.warn("[stripe webhook] Missing listingId metadata");
        return res.status(200).json({ received: true });
      }

      // Load listing to capture sellerId and prevent invalid updates
      const listingRef = adminDb.collection("listings").doc(String(listingId));
      const listingSnap = await listingRef.get();
      const listing: any = listingSnap.exists ? listingSnap.data() : null;
      const sellerId = String(listing?.sellerId || listing?.sellerEmail || listing?.seller || "");

      // Prevent duplicate orders (by session id)
      const existingOrder = await adminDb
        .collection("orders")
        .where("stripeSessionId", "==", session.id)
        .limit(1)
        .get();

      // Stripe type definitions can differ by version; safely read shipping details.
      const shippingDetails = (session as any)?.shipping_details;
      const shippingAddress = shippingDetails?.address || session.customer_details?.address || null;

      if (existingOrder.empty) {
        await adminDb.collection("orders").add({
          stripeSessionId: session.id,
          listingId,
          ...(sellerId ? { sellerId } : {}),
          buyerEmail: session.customer_details?.email || "",
          buyerName: session.customer_details?.name || "",
          amountTotal: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "paid",
          createdAt: Date.now(),
          shippingAddress,
        });
      }

      // Mark listing sold (only if it exists)
      if (listingSnap.exists) {
        await listingRef.update({
          status: "sold",
          isSold: true,
          soldAt: Date.now(),
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] Processing error:", err);
    return res.status(500).end();
  }
}
