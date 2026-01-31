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
  | { ok: true; challengeId: string; via: "email"; devCode?: string }
  | { ok: false; error: string; message?: string };

function canSendEmail() {
  // If you configure SMTP, sendLoginCode will work. Otherwise we fall back to devCode.
  // Add EMAIL_DISABLED=1 to force devCode mode.
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

  // 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 1) Store challenge (Firestore if configured, otherwise in-memory)
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
      console.error(
        "[start-2fa] Firestore write failed; using in-memory fallback",
        err
      );
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

  // 2) Send code via email when possible; otherwise return devCode
  let devCode: string | undefined = undefined;

  if (canSendEmail()) {
    try {
      await sendLoginCode(normalizedEmail, code);
    } catch (emailErr) {
      console.error("[start-2fa] sendLoginCode failed; returning devCode", emailErr);
      devCode = code;
    }
  } else {
    devCode = code;
  }

  // 3) Respond
  return res.status(200).json({
    ok: true,
    challengeId,
    via: "email",
    ...(devCode ? { devCode } : {}),
  });
}
