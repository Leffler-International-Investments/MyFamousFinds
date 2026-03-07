// FILE: /pages/api/auth/send-password-reset.ts
// Server-side password reset using Firebase Admin + SMTP
// Replaces client-side Firebase sendPasswordResetEmail which can fail when
// Gmail is added as a Sign-in provider

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendMail, brandedEmailWrapper } from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

type Resp =
  | { ok: true; message: string }
  | { ok: false; error: string; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "buyer").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      ok: false,
      error: "missing_email",
      message: "A valid email address is required.",
    });
  }

  // Always return success to the user (don't leak whether email exists)
  const successResponse: Resp = {
    ok: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };

  if (!isFirebaseAdminReady || !adminAuth) {
    console.error(
      "[send-password-reset] CRITICAL: Firebase Admin not configured — email WILL NOT be sent.",
      "Set FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID + FB_CLIENT_EMAIL + FB_PRIVATE_KEY) in Vercel env vars."
    );
    return res.status(200).json(successResponse);
  }

  // Step 1: Generate the password reset link
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.myfamousfinds.com";

  const continueUrl =
    role === "management"
      ? `${siteUrl}/management/login`
      : role === "seller"
        ? `${siteUrl}/seller/login`
        : `${siteUrl}/${role}/signin`;

  let resetLink: string;
  try {
    resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: continueUrl,
      handleCodeInApp: false,
    });
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "auth/user-not-found" || code === "auth/email-not-found") {
      console.log(`[send-password-reset] No account found for ${email}`);
      return res.status(200).json(successResponse);
    }
    console.error(`[send-password-reset] Error generating link: code=${code} message=${err?.message}`, err);
    return res.status(200).json(successResponse);
  }

  // Step 2: Build the email content
  const subject = "Famous Finds — Reset Your Password";
  const text =
    "Hello,\n\n" +
    "We received a request to reset your password for your Famous Finds account.\n\n" +
    "Click the link below to set a new password:\n\n" +
    `${resetLink}\n\n` +
    "This link will expire in 1 hour.\n\n" +
    "If you did not request a password reset, you can safely ignore this email.\n\n" +
    "Regards,\nThe Famous Finds Team";

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Reset Your Password</p>` +
    `<p style="margin:0 0 20px 0;">We received a request to reset your password for your <b>Famous Finds</b> account.</p>` +
    `<p style="margin:0 0 20px 0;text-align:center;">` +
    `<a href="${resetLink}" style="display:inline-block;padding:14px 36px;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">RESET PASSWORD</a>` +
    `</p>` +
    `<p style="margin:0 0 8px 0;font-size:13px;color:#78716c;">Or copy and paste this link into your browser:</p>` +
    `<p style="margin:0 0 20px 0;font-size:12px;color:#a8a29e;word-break:break-all;">${resetLink}</p>` +
    `<p style="margin:0 0 8px 0;font-size:12px;color:#a8a29e;">This link will expire in 1 hour.</p>` +
    `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">If you did not request a password reset, you can safely ignore this email.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

  // Step 3: Send immediately; on failure, queue for retry via the outbox
  try {
    await sendMail(email, subject, text, html);
    console.log(`[send-password-reset] Reset email sent to ${email}`);
  } catch (err) {
    console.error("[send-password-reset] Send failed, queuing for retry:", err);
    try {
      await queueEmail({
        to: email,
        subject,
        text,
        html,
        eventType: "password_reset",
        eventKey: `password_reset:${role}:${email}:${Date.now()}`,
      });
      console.log(`[send-password-reset] Queued email for retry to ${email}`);
    } catch (queueErr) {
      console.error("[send-password-reset] Failed to queue email:", queueErr);
    }
  }

  return res.status(200).json(successResponse);
}
