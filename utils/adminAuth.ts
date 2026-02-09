// FILE: /utils/adminAuth.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Shared guard for all /api/admin/* and /api/management/* endpoints.
 *
 * Two auth paths:
 *  1) x-admin-secret header — for server-to-server / cron calls
 *  2) x-management-email header — for management dashboard browser calls
 *     (verified against MANAGEMENT_SUPER_EMAILS allow-list)
 */

export function getAdminSecretFromRequest(req: NextApiRequest): string {
  return String(req.headers["x-admin-secret"] || "").trim();
}

/** Check if the request has a valid management email from the allow-list. */
function isManagementEmailValid(req: NextApiRequest): boolean {
  const email = String(req.headers["x-management-email"] || "").trim().toLowerCase();
  if (!email) return false;
  const allowList = (process.env.MANAGEMENT_SUPER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowList.length === 0) return false;
  return allowList.includes(email);
}

export function isAdminRequest(req: NextApiRequest): boolean {
  // Path 1: server-to-server secret
  const secret = String(process.env.ADMIN_API_SECRET || "").trim();
  if (secret) {
    const got = getAdminSecretFromRequest(req);
    if (got && got === secret) return true;
  }

  // Path 2: management dashboard browser call with verified email
  if (isManagementEmailValid(req)) return true;

  return false;
}

/**
 * Returns true if authorized; otherwise writes response + returns false.
 */
export function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  if (isAdminRequest(req)) return true;

  res.status(401).json({ ok: false, error: "unauthorized" });
  return false;
}
