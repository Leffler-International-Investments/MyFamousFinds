// FILE: /pages/api/user/preferences.ts
// Save user shopping preferences for personalized recommendations

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
    const { interests, preferredSize, ageRange } = req.body || {};

    await adminDb.collection("userPreferences").doc(authUser.uid).set(
      {
        uid: authUser.uid,
        interests: Array.isArray(interests) ? interests : [],
        preferredSize: preferredSize || "",
        ageRange: ageRange || "",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("user/preferences error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
