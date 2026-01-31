// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";
import { createChallenge } from "../../../utils/twofaStore";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
};

type Start2faResponse =
  | {
      ok: true;
      challengeId: string;
      message: string;
      devCode?: string;
    }
  | { ok: false; error: string; message?: string };

function canSendEmail() {
  if (process.env.EMAIL_DISABLED === "1") return false;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  const { email, role } = (req.body || {}) as Start2faBody;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, error: "missing_email", message: "Email required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole: "seller" | "management" =
    role === "seller" ? "seller" : "management";

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 1) Store challenge
  let challengeId: string | null = null;

  if (isFirebaseAdminReady && adminDb) {
    try {
      const docRef = await adminDb.collection("loginChallenges").add({
        email: normalizedEmail,
        role: normalizedRole,
        code,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });
      challengeId = docRef.id;
    } catch (err) {
      console.error("[start-2fa] Firestore failed, using memory", err);
    }
  }

  if (!challengeId) {
    const ch = createChallenge({
      email: normalizedEmail,
      role: normalizedRole,
      code,
    });
    challengeId = ch.id;
  }

  // 2) Email or dev mode
  let devCode: string | undefined;

  if (canSendEmail()) {
    try {
      await sendLoginCode(normalizedEmail, code);
    } catch {
      devCode = code;
    }
  } else {
    devCode = code;
  }

  // 3) FINAL RESPONSE WITH CORRECT WORDING
  if (devCode) {
    return res.status(200).json({
      ok: true,
      challengeId,
      devCode,
      message: `Your 6-digit code is: ${devCode}`,
    });
  }

  return res.status(200).json({
    ok: true,
    challengeId,
    message: "We've sent a 6-digit code to your email address.",
  });
}
