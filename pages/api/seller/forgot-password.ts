// FILE: /pages/api/seller/forgot-password.ts
// Seller password reset — delegates to the shared send-password-reset endpoint

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

type Resp =
  | { ok: true; message: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ ok: false, error: "A valid email is required." });
  }

  // Always return success to avoid leaking whether the email exists
  const successResponse: Resp = {
    ok: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };

  if (!isFirebaseAdminReady || !adminAuth) {
    console.error(
      "[seller-forgot-password] CRITICAL: Firebase Admin not configured — email WILL NOT be sent.",
      "Set FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID + FB_CLIENT_EMAIL + FB_PRIVATE_KEY) in Vercel env vars."
    );
    return res.status(200).json(successResponse);
  }

  // Step 1: Verify seller exists in Firestore
  try {
    if (adminDb) {
      let found = false;
      const byId = await adminDb.collection("sellers").doc(email).get();
      if (byId.exists) found = true;

      if (!found) {
        const byEmail = await adminDb
          .collection("sellers")
          .where("email", "==", email)
          .limit(1)
          .get();
        if (!byEmail.empty) found = true;
      }

      if (!found) {
        const byContact = await adminDb
          .collection("sellers")
          .where("contactEmail", "==", email)
          .limit(1)
          .get();
        if (!byContact.empty) found = true;
      }

      if (!found) {
        return res.status(200).json(successResponse);
      }
    }
  } catch (err) {
    console.error("[seller-forgot-password] Error checking seller:", err);
    return res.status(200).json(successResponse);
  }

  // Step 2: Generate the password reset link
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.myfamousfinds.com";

  let resetLink: string;
  try {
    resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${siteUrl}/seller/login`,
      handleCodeInApp: false,
    });
  } catch (err: any) {
    if (err.code === "auth/user-not-found" || err.code === "auth/email-not-found") {
      return res.status(200).json(successResponse);
    }
    console.error("[seller-forgot-password] Error generating link:", err);
    return res.status(200).json(successResponse);
  }

  // Step 3: Build email content
  const subject = "MyFamousFinds — Reset Your Seller Password";
  const text =
    "Hello,\n\n" +
    "We received a request to reset your seller account password on MyFamousFinds.\n\n" +
    "Click the link below to set a new password:\n\n" +
    `${resetLink}\n\n` +
    "This link will expire in 1 hour.\n\n" +
    "If you did not request this, you can safely ignore this email.\n\n" +
    "Regards,\nThe MyFamousFinds Team";

  const html =
    "<p>Hello,</p>" +
    "<p>We received a request to reset your seller account password on <b>MyFamousFinds</b>.</p>" +
    `<p><a href="${resetLink}" style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Reset Your Password</a></p>` +
    "<p>Or copy and paste this link into your browser:</p>" +
    `<p style="font-size:13px;color:#6b7280;word-break:break-all;">${resetLink}</p>` +
    "<p style=\"font-size:12px;color:#9ca3af;\">This link will expire in 1 hour.</p>" +
    "<p>If you did not request this, you can safely ignore this email.</p>" +
    "<p>Regards,<br/>The MyFamousFinds Team</p>";

  // Step 4: Send immediately; on failure, queue for retry via the outbox
  try {
    await sendMail(email, subject, text, html);
    console.log(`[seller-forgot-password] Reset email sent to ${email}`);
  } catch (err) {
    console.error("[seller-forgot-password] Send failed, queuing for retry:", err);
    try {
      await queueEmail({
        to: email,
        subject,
        text,
        html,
        eventType: "password_reset",
        eventKey: `password_reset:seller:${email}:${Date.now()}`,
      });
      console.log(`[seller-forgot-password] Queued email for retry to ${email}`);
    } catch (queueErr) {
      console.error("[seller-forgot-password] Failed to queue email:", queueErr);
    }
  }

  return res.status(200).json(successResponse);
}
