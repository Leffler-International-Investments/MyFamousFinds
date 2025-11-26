// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
};

type Start2faResponse =
  | { ok: true; challengeId: string }
  | { ok: false; error: string; message?: string };

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

  const normalizedRole: "seller" | "management" =
    role === "seller" ? "seller" : "management";

  // 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Fallback challenge id
  let challengeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // 1) Store challenge in Firestore if adminDb is available
    if (adminDb) {
      const docRef = await adminDb.collection("loginChallenges").add({
        email,
        role: normalizedRole,
        code,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });
      challengeId = docRef.id;
    } else {
      console.warn(
        "[start-2fa] adminDb not available – skipping Firestore challenge store"
      );
    }

    // 2) Send email with login code (will throw if SMTP not configured)
    try {
      await sendLoginCode(email, code);
    } catch (emailErr) {
      console.error("[start-2fa] sendLoginCode failed:", emailErr);
      // We still allow flow to continue; the UI can show generic error if needed
    }

    // 3) Always respond ok so the front-end can continue
    return res.status(200).json({ ok: true, challengeId });
  } catch (err: any) {
    console.error("start-2fa error", err);

    // FINAL FALLBACK: do not break login completely
    return res.status(200).json({
      ok: true,
      challengeId,
    });
  }
}
