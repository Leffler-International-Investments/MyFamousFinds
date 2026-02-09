FILE: /pages/api/seller/stripe-connect/start.ts
// FILE: /pages/api/seller/stripe-connect/start.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getStripeClient } from "../../../../lib/stripe";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const stripe = await getStripeClient();
  if (!stripe) return res.status(500).json({ ok: false, error: "stripe_not_configured" });

  const sellerRef = adminDb.collection("sellers").doc(sellerId);
  const sellerSnap = await sellerRef.get();
  const seller = sellerSnap.exists ? (sellerSnap.data() as any) : {};
  const email = String(seller.email || seller.contactEmail || "");

  let stripeAccountId = seller.stripeAccountId as string | undefined;
  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: email || undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    stripeAccountId = acct.id;

    await sellerRef.set(
      {
        stripeAccountId,
        stripeAccountStatus: "created",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${baseUrl}/seller/settings?stripe=refresh`,
    return_url: `${baseUrl}/seller/settings?stripe=return`,
    type: "account_onboarding",
  });

  return res.status(200).json({ ok: true, url: accountLink.url, stripeAccountId });
}
