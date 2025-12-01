// FILE: /pages/api/seller/onboard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";

type OnboardResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY env var is missing");
}

// IMPORTANT: no apiVersion here → avoids the "2025-10-29.clover" TS error
const stripe = new Stripe(stripeSecretKey, {});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OnboardResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "missing_or_invalid_email" });
    }

    const lowerEmail = email.toLowerCase();

    // 1) Look up seller doc in Firestore (collection: sellers, id = email)
    const sellerRef = adminDb.collection("sellers").doc(lowerEmail);
    const sellerSnap = await sellerRef.get();
    const sellerData = sellerSnap.data() || {};

    let stripeAccountId: string | undefined = sellerData.stripeAccountId;

    // 2) Create Stripe Express account if missing
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: lowerEmail,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await sellerRef.set(
        {
          email: lowerEmail,
          stripeAccountId,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // 3) Create onboarding link (Stripe Connect)
    const origin =
      (req.headers.origin as string | undefined) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://myfamousfinds.com";

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${origin}/seller/banking?refresh=1`,
      return_url: `${origin}/seller/banking?completed=1`,
    });

    return res.status(200).json({ ok: true, url: link.url });
  } catch (err: any) {
    console.error("seller_onboard_error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "stripe_onboarding_failed",
    });
  }
}
