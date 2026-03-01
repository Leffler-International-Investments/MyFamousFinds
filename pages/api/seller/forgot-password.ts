// FILE: /pages/api/seller/forgot-password.ts
// Seller password reset — generates a Firebase Auth reset link, extracts the
// oobCode, builds a link to our own /seller/reset-password page, and sends
// a branded email via lib/mailer.ts (AWS SES → SMTP fallback).
//
// DIAGNOSTIC MODE: Returns clear errors about exactly what went wrong
// so the admin can fix email configuration issues instead of guessing.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendPasswordResetEmail } from "../../../lib/mailer";
import { queueEmail } from "../../../utils/emailOutbox";
import { rateLimitForgotPassword } from "../../../lib/rateLimit";

type Resp =
  | { ok: true; message: string; debug?: string }
  | { ok: false; error: string; debug?: string };

/** Extract the oobCode query parameter from a Firebase password-reset link. */
function extractOobCode(firebaseLink: string): string | null {
  try {
    const url = new URL(firebaseLink);
    return url.searchParams.get("oobCode");
  } catch {
    return null;
  }
}

/** Build a short diagnostic string about email transport configuration. */
function emailConfigSummary(): string {
  const sesKey = process.env.AWS_ACCESS_KEY_ID;
  const sesSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const sesFrom = process.env.AWS_SES_FROM;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_USER_ADMIN;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASS_ADMIN;

  const parts: string[] = [];

  if (sesKey && sesSecret) {
    parts.push(
      `SES: configured (region=${process.env.AWS_REGION || "us-east-1"}, from=${sesFrom || "default"})`
    );
  } else {
    parts.push("SES: NOT configured (missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY)");
  }

  if (smtpHost && smtpUser && smtpPass) {
    parts.push(`SMTP: configured (host=${smtpHost}, user=${smtpUser})`);
  } else {
    const missing: string[] = [];
    if (!smtpHost) missing.push("SMTP_HOST");
    if (!smtpUser) missing.push("SMTP_USER");
    if (!smtpPass) missing.push("SMTP_PASS");
    parts.push(`SMTP: NOT configured (missing ${missing.join(", ")})`);
  }

  return parts.join(" | ");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // ── Validate email ────────────────────────────
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!email || !email.includes("@") || email.length > 320) {
    return res.status(400).json({ ok: false, error: "A valid email is required." });
  }

  // ── Rate limiting ─────────────────────────────
  const ip =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]?.split(",")[0]?.trim()) ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!rateLimitForgotPassword(ip, email)) {
    console.warn(`[forgot-password] Rate-limited: ip=${ip} email=${email}`);
    return res
      .status(429)
      .json({ ok: false, error: "Too many requests. Please try again in a few minutes." });
  }

  // ── Firebase Admin check ──────────────────────
  if (!isFirebaseAdminReady || !adminAuth) {
    const msg =
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel env vars.";
    console.error(`[forgot-password] ${msg}`);
    return res.status(500).json({ ok: false, error: msg });
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
  let firebaseLink: string | null = null;

  try {
    firebaseLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
    console.log(`[forgot-password] Reset link generated for ${email}`);
  } catch (err: any) {
    const code = err?.code || "";
    console.log(
      `[forgot-password] generatePasswordResetLink error: code=${code} message=${err?.message}`
    );

    if (code === "auth/user-not-found" || code === "auth/email-not-found") {
      console.log(`[forgot-password] No Auth user for ${email}, checking Firestore…`);
    } else {
      console.error("[forgot-password] Unexpected Auth error:", err);
      return res.status(500).json({
        ok: false,
        error: `Firebase Auth error: ${err?.message || code || "unknown"}`,
        debug: `generatePasswordResetLink failed — code=${code}`,
      });
    }
  }

  // ──────────────────────────────────────────────
  // Step 2: If no Auth user, verify seller exists in Firestore and create one
  // ──────────────────────────────────────────────
  if (!firebaseLink) {
    let sellerFound = false;

    try {
      if (adminDb) {
        const byId = await adminDb.collection("sellers").doc(email).get();
        if (byId.exists) sellerFound = true;

        if (!sellerFound) {
          const underscoreId = email.replace(/\./g, "_");
          if (underscoreId !== email) {
            const byUnderscore = await adminDb.collection("sellers").doc(underscoreId).get();
            if (byUnderscore.exists) sellerFound = true;
          }
        }

        if (!sellerFound) {
          const byEmail = await adminDb
            .collection("sellers")
            .where("email", "==", email)
            .limit(1)
            .get();
          if (!byEmail.empty) sellerFound = true;
        }

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
      console.error("[forgot-password] Firestore lookup error:", err);
    }

    if (!sellerFound) {
      console.log(`[forgot-password] Seller not found for ${email} — returning safe success`);
      // Don't leak that the email doesn't exist
      return res.status(200).json({
        ok: true,
        message: "If an account exists for this email, a password reset link has been sent.",
      });
    }

    try {
      await adminAuth.createUser({ email });
      console.log(`[forgot-password] Created Firebase Auth user for ${email}`);
      firebaseLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      console.log(`[forgot-password] Reset link generated after user creation for ${email}`);
    } catch (createErr: any) {
      console.error("[forgot-password] Failed to create user or generate link:", createErr);
      return res.status(500).json({
        ok: false,
        error: `Could not generate reset link: ${createErr?.message || "unknown error"}`,
      });
    }
  }

  if (!firebaseLink) {
    console.error("[forgot-password] BUG: firebaseLink is still null");
    return res.status(500).json({
      ok: false,
      error: "Internal error: could not generate reset link. Check server logs.",
    });
  }

  // ──────────────────────────────────────────────
  // Step 3: Build our own reset URL with oobCode
  // ──────────────────────────────────────────────
  const oobCode = extractOobCode(firebaseLink);
  const resetUrl = oobCode
    ? `${siteUrl}/seller/reset-password?oobCode=${encodeURIComponent(oobCode)}`
    : firebaseLink;

  // ──────────────────────────────────────────────
  // Step 4: Send the email — surface ALL errors clearly
  // ──────────────────────────────────────────────
  const configInfo = emailConfigSummary();
  console.log(`[forgot-password] Email config: ${configInfo}`);

  try {
    await sendPasswordResetEmail(email, resetUrl);
    console.log(`[forgot-password] Reset email SENT to ${email}`);
    return res.status(200).json({
      ok: true,
      message: "Password reset email sent. Check your inbox (and spam folder).",
    });
  } catch (sendErr: any) {
    const errMsg = String(sendErr?.message || sendErr || "Unknown send error");
    console.error(`[forgot-password] sendPasswordResetEmail FAILED: ${errMsg}`);
    console.error(`[forgot-password] Config at time of failure: ${configInfo}`);

    // Determine a user-friendly diagnostic message
    let userError: string;
    let debug: string = `Transport error: ${errMsg} | ${configInfo}`;

    if (errMsg.includes("not verified") || errMsg.includes("identity")) {
      userError =
        "AWS SES rejected the email — the sender identity is not verified. " +
        "Check that myfamousfinds.com is verified in the AWS SES console and SES is out of sandbox mode.";
    } else if (errMsg.includes("Sandbox") || errMsg.includes("sandbox")) {
      userError =
        "AWS SES is in sandbox mode — it can only send to verified email addresses. " +
        "Request production access in the AWS SES console, or verify the recipient email.";
    } else if (errMsg.includes("credentials") || errMsg.includes("Credential")) {
      userError =
        "AWS credentials are invalid or expired. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel env vars.";
    } else if (errMsg.includes("No email transport") || errMsg.includes("not configured")) {
      userError =
        "No email provider is configured. Set AWS SES credentials or SMTP_HOST/SMTP_USER/SMTP_PASS in Vercel env vars.";
    } else if (errMsg.includes("SMTP") || errMsg.includes("EAUTH") || errMsg.includes("535")) {
      userError =
        "SMTP authentication failed. Check SMTP_USER and SMTP_PASS (or SMTP_USER_ADMIN/SMTP_PASS_ADMIN) in Vercel env vars. " +
        "For Gmail, use an App Password (not your regular password).";
    } else if (errMsg.includes("ECONNREFUSED") || errMsg.includes("ETIMEDOUT")) {
      userError =
        "Could not connect to the email server. Check SMTP_HOST and SMTP_PORT, or verify AWS SES region is correct.";
    } else {
      userError = `Email sending failed: ${errMsg.slice(0, 200)}`;
    }

    // Try queuing for background retry
    let queued = false;
    try {
      await queueEmail({
        to: email,
        subject: "My Famous Finds — Reset your password",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
        eventType: "password_reset",
        eventKey: `password_reset:seller:${email}:${Date.now()}`,
      });
      queued = true;
      console.log(`[forgot-password] Queued for background retry to ${email}`);
    } catch (queueErr) {
      console.error("[forgot-password] Queue also failed:", queueErr);
    }

    if (queued) {
      userError +=
        " The email has been queued and will retry automatically. If the issue persists, fix the configuration above.";
    }

    return res.status(500).json({
      ok: false,
      error: userError,
      debug,
    });
  }
}
