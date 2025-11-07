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
      .json({ ok: false, error: "method_not_allowed", message: "Use POST." });
  }

  try {
    const body = (req.body || {}) as Verify2faBody;
    const { challengeId, code } = body;

    if (!challengeId || !code) {
      return res.status(400).json({
        ok: false,
        error: "missing_fields",
        message: "Missing challengeId or code.",
      });
    }

    const docRef = adminDb.collection("authChallenges").doc(challengeId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({
        ok: false,
        error: "invalid_challenge",
        message: "Verification challenge not found.",
      });
    }

    const data = snap.data() as any;

    if (data.used) {
      return res.status(400).json({
        ok: false,
        error: "already_used",
        message: "This code has already been used.",
      });
    }

    const now = Date.now();
    const expiresAt = data.expiresAt?.toMillis
      ? data.expiresAt.toMillis()
      : new Date(data.expiresAt).getTime();

    if (expiresAt && now > expiresAt) {
      return res.status(400).json({
        ok: false,
        error: "expired",
        message: "This code has expired.",
      });
    }

    if (String(data.code) !== String(code)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_code",
        message: "Incorrect code.",
      });
    }

    // Mark as used
    await docRef.update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    // At this point you already have email+role on data, so you can
    // create your own session cookie / JWT if needed.

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("verify-2fa error", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: err?.message || "Server error",
    });
  }
}
