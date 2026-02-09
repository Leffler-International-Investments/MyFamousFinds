// FILE: /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getStripeClient } from "../../../lib/stripe";

export const config = { api: { bodyParser: false } };

async function buffer(req: any) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const stripe = await getStripeClient();
  if (!stripe) return res.status(500).end();

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).end();
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed", err);
    return res.status(400).end();
  }

  // ✅ Idempotency check
  const existing = await adminDb
    .collection("stripe_events")
    .doc(event.id)
    .get();

  if (existing.exists) {
    return res.status(200).json({ received: true });
  }

  await adminDb.collection("stripe_events").doc(event.id).set({
    type: event.type,
    created: Date.now(),
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const listingId = session.metadata?.listingId;
    if (listingId) {
      await adminDb.collection("orders").add({
        stripeSessionId: session.id,
        listingId,
        buyerEmail: session.customer_details?.email || "",
        amountTotal: session.amount_total || 0,
        status: "paid",
        createdAt: Date.now(),
      });

      await adminDb.collection("listings").doc(listingId).update({
        status: "sold",
        isSold: true,
      });
    }
  }

  res.json({ received: true });
}
