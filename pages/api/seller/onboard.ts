// FILE: /pages/api/seller/onboard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";

// Load Stripe secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
if (!stripeSecretKey) {
  throw new Error("❌ Missing STRIPE_SECRET_KEY");
}

// Stripe init — FIXED API VERSION
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ ok: false, error: "Missing uid" });
    }

    // Retrieve Firestore user
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const user = userSnap.data();

    // If seller already has a Stripe account — return existing link
    if (user?.stripeAccountId) {
      const link = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/banking`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/banking`,
        type: "account_onboarding",
      });

      return res.status(200).json({ ok: true, url: link.url });
    }

    // Create new Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "AU",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    // Save Stripe account ID in Firestore
    await userRef.update({
      stripeAccountId: account.id,
    });

    // Create onboarding link
    const onboardingLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/banking`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/banking`,
      type: "account_onboarding",
    });

    return res.status(200).json({ ok: true, url: onboardingLink.url });
  } catch (error: any) {
    console.error("Stripe Seller Onboarding Error:", error);
    return res
      .status(500)
      .json({ ok: false, error: error.message || "Stripe error" });
  }
}
