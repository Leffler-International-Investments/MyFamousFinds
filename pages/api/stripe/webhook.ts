// FILE: /pages/api/stripe/webhook.ts

import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

/**
 * IMPORTANT (Next.js 16 + Turbopack)
 * ---------------------------------
 * - `config` MUST be declared INLINE in this file
 * - `config` MUST NOT be re-exported
 * - bodyParser MUST be disabled for Stripe webhooks
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

// Stripe init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // ✅ MUST match your installed Stripe types (literal)
  apiVersion: "2025-10-29.clover",
});

// Raw body helper
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // TODO:
        // - mark order as paid
        // - store billing + shipping address
        // - notify seller + create shipping label flow
        // - release seller payout only after delivery confirmation (your choice)

        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
};

export default handler;
