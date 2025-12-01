// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Ensure env exists
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
if (!stripeSecretKey) {
  throw new Error("❌ Missing STRIPE_SECRET_KEY in environment variables.");
}

// Stripe initialization (fixed API version)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

type SuccessResponse = { ok: true; url: string };
type ErrorResponse = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { priceId, sellerStripeAccountId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        ok: false,
        error: "Missing priceId",
      });
    }

    if (!sellerStripeAccountId) {
      return res.status(400).json({
        ok: false,
        error: "Missing sellerStripeAccountId",
      });
    }

    // Create Checkout Session for the seller using Stripe Connect
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      },
      {
        // Connect account to route the payout
        stripeAccount: sellerStripeAccountId,
      }
    );

    return res.status(200).json({ ok: true, url: session.url! });
  } catch (error: any) {
    console.error("❌ Stripe checkout session error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Stripe session creation error",
    });
  }
}
