// FILE: /pages/api/auth/re-enable-buyer.ts
// Re-enables a disabled Firebase Auth account for a legitimate buyer/customer.
// Called automatically by the buyer login page when auth/user-disabled is encountered.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../../utils/firebaseAdmin";

type Resp =
  | { ok: true }
  | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ ok: false, message: "Email is required" });
  }

  if (!adminAuth) {
    return res.status(500).json({ ok: false, message: "Firebase Admin not available" });
  }

  try {
    // 1) Verify the Firebase Auth account exists and is disabled
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        return res.status(404).json({ ok: false, message: "Account not found" });
      }
      throw err;
    }

    if (!authUser.disabled) {
      // Account is not disabled — nothing to do
      return res.status(200).json({ ok: true });
    }

    // 2) Check if this email has a customer record in Firestore (users collection).
    //    We only re-enable accounts that belong to legitimate buyers.
    let hasCustomerRecord = false;
    if (adminDb) {
      const snap = await adminDb
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
      hasCustomerRecord = !snap.empty;
    }

    if (!hasCustomerRecord) {
      // No customer record — don't re-enable. This might be a seller-only account.
      return res.status(403).json({
        ok: false,
        message: "No customer account found for this email. Please contact support.",
      });
    }

    // 3) Re-enable the Firebase Auth account
    await adminAuth.updateUser(authUser.uid, { disabled: false });
    console.log(`[RE-ENABLE-BUYER] Re-enabled Firebase Auth for buyer: ${email}`);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[RE-ENABLE-BUYER] Error:", err);
    return res.status(500).json({ ok: false, message: "Server error. Please try again." });
  }
}
