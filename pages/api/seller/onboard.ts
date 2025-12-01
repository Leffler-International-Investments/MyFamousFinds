// FILE: /pages/api/seller/onboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../../utils/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Missing userId or email" });
    }

    // 1️⃣ Fetch seller record
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    let stripeAccountId = userData.stripeAccountId;

    // 2️⃣ Create Stripe EXPRESS account if none exists
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await userRef.update({ stripeAccountId });
    }

    // 3️⃣ Create onboarding link
    const origin = req.headers.origin || "https://myfamousfinds.com";

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/seller/banking`,
      return_url: `${origin}/seller/banking`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: link.url });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err.message || "Stripe onboarding failed" });
  }
}
