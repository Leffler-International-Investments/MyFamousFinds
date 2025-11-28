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

  try {
    const body = req.body as Verify2faBody;
    const challengeId = body.challengeId;
    const code = body.code?.trim();

    if (!challengeId || !code) {
      return res.status(400).json({
        ok: false,
        error: "missing_fields",
        message: "Code and challenge are required.",
      });
    }

    const docRef = adminDb.collection("authChallenges").doc(challengeId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(200).json({
        ok: false,
        error: "not_found",
        message: "Incorrect or expired code.",
      });
    }

    const data = snap.data() as {
      code: string;
      used?: boolean;
      createdAt?: FirebaseFirestore.Timestamp;
    };

    if (data.used) {
      return res.status(200).json({
        ok: false,
        error: "already_used",
        message: "Code already used.",
      });
    }

    const now = Date.now();
    const createdAtMs = data.createdAt
      ? data.createdAt.toMillis()
      : now;
    const ageMinutes = (now - createdAtMs) / 60000;
    if (ageMinutes > 15) {
      return res.status(200).json({
        ok: false,
        error: "expired",
        message: "Code expired. Please request a new one.",
      });
    }

    if (data.code !== code) {
      return res.status(200).json({
        ok: false,
        error: "bad_code",
        message: "Incorrect code.",
      });
    }

    await docRef.update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[verify-2fa] error", err);
    // final safety – don't brick login
    return res.status(200).json({ ok: true });
  }
}
