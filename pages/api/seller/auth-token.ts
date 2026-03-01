// FILE: /pages/api/seller/auth-token.ts
/**
 * Lightweight endpoint to issue a Firebase custom token for an approved seller.
 *
 * Used by sellerClient.ts to recover the Firebase Auth session when
 * auth.currentUser is null (e.g. after page refresh or if the initial
 * signInWithCustomToken during login failed silently).
 *
 * Security:
 * - Only works for sellers with status "Approved" in Firestore
 * - The returned custom token is scoped to that seller's Firebase Auth UID
 * - All downstream API endpoints still verify seller status independently
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type AuthTokenResponse =
  | { ok: true; firebaseToken: string }
  | { ok: false; error: string };

function isApprovedStatus(status: unknown): boolean {
  const s = String(status || "").trim().toLowerCase();
  return s === "approved" || s === "active";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthTokenResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  if (!isFirebaseAdminReady || !adminDb || !adminAuth) {
    return res.status(503).json({ ok: false, error: "Firebase not configured" });
  }

  const { email } = (req.body || {}) as { email?: string };
  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return res.status(400).json({ ok: false, error: "Valid email required" });
  }

  try {
    // 4-way seller lookup (mirrors getSellerId in authServer.ts)
    let sellerSnap: any = await adminDb.collection("sellers").doc(trimmedEmail).get();

    if (!sellerSnap.exists) {
      const underscoreId = trimmedEmail.replace(/\./g, "_");
      if (underscoreId !== trimmedEmail) {
        sellerSnap = await adminDb.collection("sellers").doc(underscoreId).get();
      }
    }

    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      return res.status(404).json({ ok: false, error: "Seller not found" });
    }

    const data = sellerSnap.data ? sellerSnap.data() : {};
    if (!isApprovedStatus(data.status) && !data.isSuperSeller) {
      return res.status(403).json({ ok: false, error: "Seller not approved" });
    }

    // Ensure a Firebase Auth user exists for this email
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(trimmedEmail);
      uid = userRecord.uid;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({ email: trimmedEmail });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    const firebaseToken = await adminAuth.createCustomToken(uid);
    return res.status(200).json({ ok: true, firebaseToken });
  } catch (err: any) {
    console.error("[auth-token] Error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}
