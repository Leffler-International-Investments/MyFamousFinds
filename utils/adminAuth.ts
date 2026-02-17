// FILE: /utils/adminAuth.ts

import type { NextApiRequest, NextApiResponse } from "next";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
  getAdminEmails,
} from "./adminSession";

/**
 * Extract ADMIN_API_SECRET from a request header or query param.
 */
export function getAdminSecretFromRequest(req: NextApiRequest): string {
  return String(
    req.headers["x-admin-secret"] || req.query.secret || ""
  ).trim();
}

/**
 * Check if the request carries a valid ADMIN_API_SECRET (server-to-server).
 */
export function isAdminRequest(req: NextApiRequest): boolean {
  const secret = getAdminSecretFromRequest(req);
  const expected = process.env.ADMIN_API_SECRET;
  return Boolean(expected && secret === expected);
}

/**
 * Verify the caller is an authorised admin.
 *
 * Checks (in order):
 *   1. ADMIN_API_SECRET header (for server-to-server / cron calls)
 *   2. Signed session cookie (set during management login + 2FA)
 *
 * If neither is valid the response is set to 401/403 and false is returned.
 * All checks are synchronous so no call-site changes are required.
 */
export function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  _opts?: { missingSecretStatus?: number }
): boolean {
  // 1. Server-to-server secret
  if (isAdminRequest(req)) return true;

  // 2. Signed session cookie
  const raw: string =
    (req.cookies && req.cookies[ADMIN_SESSION_COOKIE]) || "";

  if (!raw) {
    res.status(401).json({ error: "Unauthorized — please sign in to management." });
    return false;
  }

  const result = verifySessionToken(raw);

  if (!result.valid) {
    res.status(401).json({ error: "Session expired — please sign in again." });
    return false;
  }

  // Verify the email belongs to an authorised admin
  const admins = getAdminEmails();
  if (admins.size > 0 && !admins.has(result.email)) {
    res.status(403).json({ error: "Forbidden — not an authorised admin." });
    return false;
  }

  return true;
}
