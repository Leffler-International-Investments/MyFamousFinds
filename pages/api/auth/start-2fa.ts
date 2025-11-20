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
  // 1. Method Check
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "Use POST." });
  }

  try {
    const body = (req.body || {}) as Start2faBody;
    const email = (body.email || "").trim().toLowerCase();
    const role = body.role || "management";

    // 2. Input Validation
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email address is required.",
      });
    }

    // 3. Generate Code and Expiration
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save Challenge in Firestore
    const docRef = await adminDb.collection("authChallenges").add({
      email,
      role,
      code,
      expiresAt,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5. Try to send the email
    let mailError: any = null;
    try {
      await sendLoginCode(email, code);
    } catch (err: any) {
      mailError = err;
      console.error("sendLoginCode failed:", err?.message || err);
    }

    // 6. If sending failed AND no backdoor is configured, return error
    const backdoor = process.env.ADMIN_BACKDOOR_CODE;
    if (mailError && !backdoor) {
      return res.status(500).json({
        ok: false,
        error: "email_failed",
        message: "Unable to send verification code. Please try again later.",
      });
    }

    // 7. Success: even if email failed, front-end can use backdoor code
    return res.status(200).json({
      ok: true,
      challengeId: docRef.id,
    });
  } catch (err: any) {
    console.error("start-2fa error", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: err?.message || "Server error",
    });
  }
}
