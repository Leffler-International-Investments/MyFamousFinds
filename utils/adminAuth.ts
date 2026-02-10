// FILE: /utils/adminAuth.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Shared guard for all /api/admin/* and /api/management/* endpoints.
 *
 * ✅ Production rule: ADMIN_API_SECRET MUST be set in Vercel.
 * ✅ Client rule: send header `x-admin-secret: <ADMIN_API_SECRET>`
 */

export function getAdminSecretFromRequest(req: NextApiRequest): string {
  return String(req.headers["x-admin-secret"] || "").trim();
}

export function isAdminRequest(req: NextApiRequest): boolean {
  const required = String(process.env.ADMIN_API_SECRET || "").trim();
  if (!required) return false; // secure default
  const got = getAdminSecretFromRequest(req);
  return !!got && got === required;
}

/**
 * Returns true if authorized; otherwise writes response + returns false.
 */
export function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  opts?: { missingSecretStatus?: number }
): boolean {
  const required = String(process.env.ADMIN_API_SECRET || "").trim();
  if (!required) {
    const status = opts?.missingSecretStatus ?? 500;
    res.status(status).json({ ok: false, error: "ADMIN_API_SECRET_not_set" });
    return false;
  }
  const got = getAdminSecretFromRequest(req);
  if (!got || got !== required) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return false;
  }
  return true;
}
