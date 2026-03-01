// FILE: /pages/api/seller/forgot-password.ts
// Seller password reset — generates a Firebase Auth reset link and sends via email.
//
// Flow:
//   1. Try Firebase Auth first — if the user exists, generate the link immediately.
//   2. If Auth says "user not found", check Firestore to see if this email
//      belongs to a seller. If it does, create a Firebase Auth account and retry.
//   3. Send the email via sendMail (SES → SMTP fallback).
//
// This order is important: the old code checked Firestore FIRST, which meant
// that if the Firestore lookup failed (wrong doc ID format, permissions, etc.)
// the email was never sent even though the user had a valid Firebase Auth account.

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.myfamousfinds.com";

  const actionCodeSettings = {
    url: `${siteUrl}/seller/login`,
    handleCodeInApp: false,
  };

  // ──────────────────────────────────────────────
  // Step 1: Try to generate the reset link directly
  // ──────────────────────────────────────────────
  let resetLink: string | null = null;

  try {
    resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
    console.log(`[seller-forgot-password] Reset link generated for ${email}`);
  } catch (err: any) {
    const code = err?.code || "";
    console.log(`[seller-forgot-password] generatePasswordResetLink error: code=${code} message=${err?.message}`);

    if (code === "auth/user-not-found" || code === "auth/email-not-found") {
      // User does not exist in Firebase Auth — check Firestore next
      console.log(`[seller-forgot-password] No Auth user for ${email}, checking Firestore…`);
    } else {
      // Unexpected error (invalid domain, config issue, etc.)
      console.error("[seller-forgot-password] Unexpected Auth error:", err);
      return res.status(200).json(successResponse);
    }
  }

  // ──────────────────────────────────────────────
  // Step 2: If no Auth user, verify seller exists in Firestore and create one
  // ──────────────────────────────────────────────
  if (!resetLink) {
    let sellerFound = false;

    try {
      if (adminDb) {
        // Check doc ID = raw email
        const byId = await adminDb.collection("sellers").doc(email).get();
        if (byId.exists) sellerFound = true;

        // Check doc ID = underscore format (e.g. "user@gmail_com")
        if (!sellerFound) {
          const underscoreId = email.replace(/\./g, "_");
          if (underscoreId !== email) {
            const byUnderscore = await adminDb.collection("sellers").doc(underscoreId).get();
            if (byUnderscore.exists) sellerFound = true;
          }
        }

        // Check by email field
        if (!sellerFound) {
          const byEmail = await adminDb
            .collection("sellers")
            .where("email", "==", email)
            .limit(1)
            .get();
          if (!byEmail.empty) sellerFound = true;
        }

        // Check by contactEmail field
        if (!sellerFound) {
          const byContact = await adminDb
            .collection("sellers")
            .where("contactEmail", "==", email)
            .limit(1)
            .get();
          if (!byContact.empty) sellerFound = true;
        }
      }
    } catch (err) {
      console.error("[seller-forgot-password] Firestore lookup error:", err);
      // Don't return — we still want to try creating the auth user
      // if Firestore is misconfigured but the email looks legitimate.
    }

    if (!sellerFound) {
      console.log(`[seller-forgot-password] Seller not found in Firestore for ${email}`);
      return res.status(200).json(successResponse);
    }

    // Seller exists in Firestore but not in Auth — create the Auth account
    try {
      await adminAuth.createUser({ email });
      console.log(`[seller-forgot-password] Created Firebase Auth user for ${email}`);
      resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      console.log(`[seller-forgot-password] Reset link generated after user creation for ${email}`);
    } catch (createErr: any) {
      console.error(
        "[seller-forgot-password] Failed to create user or generate link:",
        createErr?.code, createErr?.message
      );
      return res.status(200).json(successResponse);
    }
  }

  // Safety check — should not happen, but guard against it
  if (!resetLink) {
    console.error("[seller-forgot-password] BUG: resetLink is still null after all attempts");
    return res.status(200).json(successResponse);
  }

  // ──────────────────────────────────────────────
  // Step 3: Build email content
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Step 4: Send the email; on failure queue for retry
  // ──────────────────────────────────────────────
  try {
    await sendMail(email, subject, text, html);
    console.log(`[seller-forgot-password] Reset email sent to ${email}`);
  } catch (err) {
    console.error("[seller-forgot-password] sendMail failed, queuing for retry:", err);
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
