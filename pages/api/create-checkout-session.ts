// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../utils/firebaseAdmin";

type SuccessResponse = { ok: true; sessionId: string; url?: string };
type ErrorResponse = { ok: false; error: string };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY env var is missing");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { listingId, quantity = 1 } = req.body as {
      listingId?: string;
      quantity?: number;
    };

    if (!listingId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing listingId in request body" });
    }

    // 1) Load listing + seller from Firestore
    const listingSnap = await adminDb.collection("listings").doc(listingId).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listingData = listingSnap.data() as any;
    const price = listingData.price; // assume in USD cents or dollars – adjust below
    const title = listingData.title || "Famous Finds item";
    const sellerId = listingData.sellerId;

    if (!sellerId) {
      return res
        .status(400)
        .json({ ok: false, error: "Listing has no sellerId" });
    }

    const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
    const stripeAccountId = sellerSnap.get("stripeAccountId") as
      | string
      | undefined;

    if (!stripeAccountId) {
      return res.status(400).json({
        ok: false,
        error: "Seller is not onboarded with Stripe yet.",
      });
    }

    // 2) Calculate amounts
    const unitAmountInCents =
      typeof price === "number" ? Math.round(price * 100) : 0;

    if (!unitAmountInCents || unitAmountInCents <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid price for listing" });
    }

    const quantitySafe = quantity > 0 ? quantity : 1;
    const lineTotal = unitAmountInCents * quantitySafe;

    // Platform fee — e.g. 15%
    const platformFeePercent = 15;
    const applicationFeeAmount = Math.round(
      (lineTotal * platformFeePercent) / 100
    );

    const origin =
      (req.headers.origin as string | undefined) ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://myfamousfinds.com";

    // 3) Create Checkout Session (destination charge)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title,
            },
            unit_amount: unitAmountInCents,
          },
          quantity: quantitySafe,
        },
      ],
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout-cancelled`,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
    });

    return res
      .status(200)
      .json({ ok: true, sessionId: session.id, url: session.url || undefined });
  } catch (err: any) {
    console.error("Stripe checkout error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
