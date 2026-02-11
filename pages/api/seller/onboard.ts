// FILE: /pages/api/seller/onboard.ts
// Seller onboarding — now simply saves PayPal email for payouts.
// No redirect to external onboarding (PayPal Payouts uses email only).

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Response =
  | { ok: true; message: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  try {
    const { email, paypalEmail } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "missing_or_invalid_email" });
    }

    const lowerEmail = email.toLowerCase();
    const sellerRef = adminDb.collection("sellers").doc(lowerEmail);

    const updateData: Record<string, any> = {
      email: lowerEmail,
      updatedAt: new Date().toISOString(),
    };

    // Save PayPal email if provided
    if (paypalEmail && typeof paypalEmail === "string") {
      updateData.paypalEmail = paypalEmail.toLowerCase().trim();
      updateData.payoutMethod = "paypal";
    }

    await sellerRef.set(updateData, { merge: true });

    return res.status(200).json({
      ok: true,
      message: "Payout profile updated. PayPal email saved for payouts.",
    });
  } catch (err: any) {
    console.error("seller_onboard_error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "onboarding_failed",
    });
  }
}
