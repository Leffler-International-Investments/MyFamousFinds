// FILE: /utils/adminSession.ts
// HMAC-signed admin session cookies for server-side admin auth.

import crypto from "crypto";
import type { NextApiResponse } from "next";

const SESSION_SECRET =
  process.env.ADMIN_API_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_DURATION_SECONDS = Math.floor(SESSION_DURATION_MS / 1000);

export const ADMIN_SESSION_COOKIE = "ff-admin-session";

/**
 * Build the set of emails that are authorised for management access.
 * Mirrors the allow-list in /api/management/login.ts.
 */
export function getAdminEmails(): Set<string> {
  const emails = new Set<string>();

  const ae = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (ae) emails.add(ae);

  (process.env.MANAGEMENT_SUPER_EMAILS || "")
    .split(",")
    .forEach((e) => {
      const t = e.trim().toLowerCase();
      if (t) emails.add(t);
    });

  // Hard-coded super-admin emails (same as management/login.ts)
  const superEmails = [
    "leffleryd@gmail.com",
    "arich1114@aol.com",
    "arichspot@gmail.com",
    "ariel@arichwines.com",
    "arielspot@gmail.com",
    "itai.leff@gmail.com",
  ];
  for (const se of superEmails) emails.add(se);

  return emails;
}

/**
 * Create an HMAC-signed session token containing the admin email and expiry.
 */
export function createSessionToken(email: string): string {
  if (!SESSION_SECRET) {
    console.error("[adminSession] Cannot create session token: no ADMIN_API_SECRET or ADMIN_PASSWORD configured.");
    return "";
  }
  const expiry = Date.now() + SESSION_DURATION_MS;
  const payload = `${email}|${expiry}`;
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}|${sig}`;
}

/**
 * Verify an HMAC-signed session token. Returns the email if valid.
 */
export function verifySessionToken(
  token: string
): { valid: true; email: string } | { valid: false } {
  if (!SESSION_SECRET) return { valid: false };
  const parts = token.split("|");
  if (parts.length !== 3) return { valid: false };

  const [email, expiryStr, sig] = parts;
  const payload = `${email}|${expiryStr}`;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return { valid: false };
  }

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { valid: false };
  }

  return { valid: true, email: email.toLowerCase() };
}

/**
 * Set the admin session cookie on a response.
 */
export function setAdminSessionCookie(res: NextApiResponse, email: string) {
  const token = createSessionToken(email.toLowerCase());
  const isProduction = process.env.NODE_ENV === "production";

  res.setHeader(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${
      isProduction ? "; Secure" : ""
    }`
  );
}
