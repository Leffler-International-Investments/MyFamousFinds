// FILE: /pages/api/seller/stripe-connect/start.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStripeClient } from "../../../../lib/stripe";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";

type Ok = { ok: true; url: string; stripeAccountId: string };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const stripe = await getStripeClient();
  if (!stripe) return res.status(500).json({ ok: false, error: "stripe_not_configured" });

  try {
    const sellerRef = adminDb.collection("sellers").doc(String(sellerId));
    const sellerSnap = await sellerRef.get();
    const seller = sellerSnap.exists ? (sellerSnap.data() as any) : {};

    const email = String(seller?.email || seller?.contactEmail || "").trim() || undefined;

    let stripeAccountId = String(seller?.stripeAccountId || "").trim() || "";

    if (!stripeAccountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: { transfers: { requested: true } },
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

    const baseUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || `https://${String(req.headers.host || "").trim()}`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/seller/settings?stripe=refresh`,
      return_url: `${baseUrl}/seller/settings?stripe=return`,
      type: "account_onboarding",
    });

    return res.status(200).json({ ok: true, url: accountLink.url, stripeAccountId });
  } catch (e: any) {
    console.error("stripe_connect_start_error", e);
    return res.status(500).json({ ok: false, error: e?.message || "server_error" });
  }
}
