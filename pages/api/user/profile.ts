// FILE: /pages/api/user/profile.ts
// Save/update user profile (used during signup and account management)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { getAuthUser } from "../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { fullName, email, phone } = req.body || {};

    const profileData: Record<string, any> = {
      uid: authUser.uid,
      fullName: fullName || "",
      email: email || authUser.email || "",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    };

    if (phone !== undefined) {
      profileData.phone = phone || "";
    }

    await adminDb.collection("users").doc(authUser.uid).set(
      profileData,
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("user/profile error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
