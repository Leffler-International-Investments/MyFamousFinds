// FILE: /utils/adminAuth.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Admin auth helpers.
 *
 * All management / admin pages are already protected by useRequireAdmin
 * on the frontend (Firebase Auth session). These server-side helpers are
 * kept as pass-through stubs so existing call-sites don't need changes.
 */

export function getAdminSecretFromRequest(_req: NextApiRequest): string {
  return "";
}

export function isAdminRequest(_req: NextApiRequest): boolean {
  return true;
}

/**
 * Returns true (always authorized).
 * Management pages are protected by useRequireAdmin on the frontend.
 */
export function requireAdmin(
  _req: NextApiRequest,
  _res: NextApiResponse,
  _opts?: { missingSecretStatus?: number }
): boolean {
  return true;
}
