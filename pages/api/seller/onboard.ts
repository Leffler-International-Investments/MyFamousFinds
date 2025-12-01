// FILE: /pages/api/seller/onboard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // adjust import if your auth file lives elsewhere
import { adminDb } from "../../../utils/firebaseAdmin";

type OnboardResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

// Use your current live API version from the Dashboard – keep as string literal
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY env var is missing");
}

const stripe = new Stripe(stripeSecretKey, {
  // 👇 this must match your account’s default API version
  apiVersion: "2024-06-20",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OnboardResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 1) Get logged-in seller
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const sellerEmail = session.user.email;

    // 2) Look up seller doc to see if we already have a connected account
    const sellerSnap = await adminDb
      .collection("sellers")
      .doc(sellerEmail)
      .get();

    let stripeAccountId = sellerSnap.get("stripeAccountId") as
      | string
      | undefined;

    // 3) If no account – create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: sellerEmail,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
      });

      stripeAccountId = account.id;

      // Save back to Firestore
      await sellerSnap.ref.set(
        { stripeAccountId },
        { merge: true }
      );
    }

    // 4) Create account link for onboarding / updating bank details
    const origin =
      (req.headers.origin as string | undefined) ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://myfamousfinds.com";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/seller/banking?refresh=1`,
      return_url: `${origin}/seller/banking?completed=1`,
      type: "account_onboarding",
    });

    return res.status(200).json({ ok: true, url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe onboard error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
