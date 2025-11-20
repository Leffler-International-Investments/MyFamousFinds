// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";

// Request body
type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
};

// Response
type Start2faResponse =
  | { ok: true; challengeId: string }
  | { ok: false; error: string; message?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  // Only POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "Use POST." });
  }

  try {
    const body = (req.body || {}) as Start2faBody;
    const email = (body.email || "").trim().toLowerCase();
    const role = body.role || "management";

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email address is required.",
      });
    }

    // Backdoor config (admin list + master code)
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
    const adminEmails = adminEmailsEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const adminBackdoorCode = process.env.ADMIN_BACKDOOR_CODE || "";
    const isAdminEmail = adminEmails.includes(email);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Create challenge doc
    const docRef = await adminDb.collection("authChallenges").add({
      email,
      role,
      code,
      expiresAt,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Try to send the email
    let emailError: any = null;
    try {
      await sendLoginCode(email, code);
    } catch (err: any) {
      console.error("sendLoginCode error", err);
      emailError = err;
    }

    // If email failed:
    //  - Normal users: return error
    //  - Admin email + backdoor code configured: allow login flow to continue
    if (emailError) {
      if (!isAdminEmail || !adminBackdoorCode) {
        return res.status(500).json({
          ok: false,
          error: "email_failed",
          message: "Unable to send verification code. Please try again later.",
        });
      }

      // Mark that email failed (for your logs)
      await docRef.update({
        emailFailed: true,
        emailError: String(emailError?.message || emailError),
      });
    }

    // Success – frontend will show the “enter 6-digit code” screen
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
