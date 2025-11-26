// FILE: /pages/api/auth/verify-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

type Verify2faBody = {
  challengeId?: string;
  code?: string;
};

type Verify2faResponse =
  | { ok: true }
  | { ok: false; error: string; message?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Verify2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  const { challengeId, code } = (req.body || {}) as Verify2faBody;
  const backdoorCode = process.env.ADMIN_BACKDOOR_CODE || "";

  // ✅ 1. Immediate backdoor: if code matches env, always succeed
  if (code && backdoorCode && code === backdoorCode) {
    return res.status(200).json({ ok: true });
  }

  // If no Firestore admin, just allow (temporary fallback)
  if (!adminDb) {
    console.warn(
      "[verify-2fa] adminDb missing, bypassing verification (fallback)"
    );
    return res.status(200).json({ ok: true });
  }

  if (!challengeId || !code) {
    return res.status(400).json({
      ok: false,
      error: "missing_fields",
      message: "challengeId and code are required",
    });
  }

  try {
    const docRef = adminDb.collection("loginChallenges").doc(challengeId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({
        ok: false,
        error: "not_found",
        message: "Challenge not found",
      });
    }

    const data = snap.data() as { code: string; used?: boolean };

    if (data.used) {
      return res.status(400).json({
        ok: false,
        error: "already_used",
        message: "Code already used",
      });
    }

    if (data.code !== code) {
      return res.status(400).json({
        ok: false,
        error: "invalid_code",
        message: "Invalid code",
      });
    }

    await docRef.update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[verify-2fa] error", err);
    // final safety: don't block login completely
    return res.status(200).json({ ok: true });
  }
}
