// FILE: /pages/api/seller/onboard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const { userId, email } = req.body || {};

    if (!userId || !email) {
      return res.status(400).json({ error: "missing_userId_or_email" });
    }

    // 1) Load seller user doc
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    let stripeAccountId: string | undefined =
      userData.stripeAccountId ||
      userData.stripeConnectId ||
      userData.sellerStripeId;

    // 2) Create EXPRESS account if missing
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await userRef.set(
        { stripeAccountId },
        { merge: true }
      );
    }

    // 3) Create onboarding link
    const origin =
      (req.headers.origin as string) || process.env.NEXT_PUBLIC_SITE_URL || "https://myfamousfinds.com";

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${origin}/seller/banking`,
      return_url: `${origin}/seller/banking`,
    });

    return res.status(200).json({ url: link.url });
  } catch (err: any) {
    console.error("seller_onboard_error", err);
    return res.status(500).json({
      error: err?.message || "stripe_onboarding_failed",
    });
  }
}
