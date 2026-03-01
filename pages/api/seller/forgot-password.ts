// FILE: /pages/api/seller/forgot-password.ts
// Seller password reset — generates a Firebase Auth reset link, extracts the
// oobCode, builds a link to our own /seller/reset-password page, and sends
// a branded email via lib/mailer.ts (AWS SES → SMTP fallback).
//
// Flow:
//   1. Validate + rate-limit the request.
//   2. Try Firebase Auth first — if the user exists, generate the link.
//   3. If Auth says "user not found", check Firestore sellers collection.
//      If found, create a Firebase Auth account and retry.
//   4. Extract oobCode from the Firebase link and build our own reset URL.
//   5. Send the email via lib/mailer.ts; on failure queue for retry.
//
// Security:
//   - Never leaks whether the email actually exists (returns ok:true).
//   - Returns ok:false ONLY for infrastructure errors (config, send failure).
//   - Rate-limited: 5 requests per 15 min per IP and per email.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendPasswordResetEmail } from "../../../lib/mailer";
import { queueEmail } from "../../../utils/emailOutbox";
import { rateLimitForgotPassword } from "../../../lib/rateLimit";

type Resp =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Extract the oobCode query parameter from a Firebase password-reset link. */
function extractOobCode(firebaseLink: string): string | null {
  try {
    const url = new URL(firebaseLink);
    return url.searchParams.get("oobCode");
  } catch {
    return null;
  }
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

  // ── "Safe" success response — does NOT leak whether email exists ──
  const safeSuccess: Resp = {
    ok: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };

  // ── Firebase Admin check ──────────────────────
  if (!isFirebaseAdminReady || !adminAuth) {
    console.error(
      "[forgot-password] CRITICAL: Firebase Admin not configured — email WILL NOT be sent.",
      "Set FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID + FB_CLIENT_EMAIL + FB_PRIVATE_KEY) in Vercel env vars."
    );
    return res
      .status(500)
      .json({ ok: false, error: "Server reset email not configured." });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.myfamousfinds.com";

  // The continueUrl doesn't matter much because we extract oobCode and build our own URL,
  // but Firebase requires it.
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
      // Unexpected error (invalid domain, config issue, etc.)
      console.error("[forgot-password] Unexpected Auth error:", err);
      return res.status(200).json(safeSuccess);
    }
  }

  // ──────────────────────────────────────────────
  // Step 2: If no Auth user, verify seller exists in Firestore and create one
  // ──────────────────────────────────────────────
  if (!firebaseLink) {
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
      console.error("[forgot-password] Firestore lookup error:", err);
    }

    if (!sellerFound) {
      console.log(`[forgot-password] Seller not found in Firestore for ${email}`);
      // Don't leak that the email doesn't exist
      return res.status(200).json(safeSuccess);
    }

    // Seller exists in Firestore but not in Auth — create the Auth account
    try {
      await adminAuth.createUser({ email });
      console.log(`[forgot-password] Created Firebase Auth user for ${email}`);
      firebaseLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      console.log(`[forgot-password] Reset link generated after user creation for ${email}`);
    } catch (createErr: any) {
      console.error(
        "[forgot-password] Failed to create user or generate link:",
        createErr?.code,
        createErr?.message
      );
      return res.status(200).json(safeSuccess);
    }
  }

  // Safety check
  if (!firebaseLink) {
    console.error("[forgot-password] BUG: firebaseLink is still null after all attempts");
    return res.status(200).json(safeSuccess);
  }

  // ──────────────────────────────────────────────
  // Step 3: Build our own reset URL with oobCode
  // ──────────────────────────────────────────────
  const oobCode = extractOobCode(firebaseLink);

  // If we can extract the oobCode, point to our own branded reset page.
  // Otherwise fall back to the raw Firebase link (still works).
  const resetUrl = oobCode
    ? `${siteUrl}/seller/reset-password?oobCode=${encodeURIComponent(oobCode)}`
    : firebaseLink;

  // ──────────────────────────────────────────────
  // Step 4: Send the email; on failure queue for retry
  // ──────────────────────────────────────────────
  try {
    await sendPasswordResetEmail(email, resetUrl);
    console.log(`[forgot-password] Reset email sent to ${email}`);
    return res.status(200).json(safeSuccess);
  } catch (sendErr: any) {
    console.error("[forgot-password] sendPasswordResetEmail failed:", sendErr);

    // Try queuing for retry
    try {
      await queueEmail({
        to: email,
        subject: "My Famous Finds — Reset your password",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
        eventType: "password_reset",
        eventKey: `password_reset:seller:${email}:${Date.now()}`,
      });
      console.log(`[forgot-password] Queued email for retry to ${email}`);
      // Queued successfully — tell the user it's on its way
      return res.status(200).json(safeSuccess);
    } catch (queueErr) {
      console.error("[forgot-password] Failed to queue email:", queueErr);
    }

    // Both direct send and queue failed — surface the error to the UI
    return res
      .status(500)
      .json({ ok: false, error: "Unable to send reset email. Please try again later." });
  }
}
