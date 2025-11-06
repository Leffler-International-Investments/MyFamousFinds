// FILE: /utils/authServer.ts

import type { NextApiRequest } from "next";

/**
 * Temporary user identification helper.
 * Replace with real auth (Firebase, cookies, etc.) when ready.
 */
export function getUserId(req: NextApiRequest): string | null {
  const header = req.headers["x-user-id"] ?? req.headers["x-userid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // Fallback so APIs keep working in dev
  return "user-demo-001";
}

/**
 * Temporary seller identification helper.
 * Replace with real seller auth later.
 */
export function getSellerId(req: NextApiRequest): string | null {
  const header =
    req.headers["x-seller-id"] ??
    req.headers["x-sellerid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // Fallback seller id so seller APIs keep working in dev
  return "seller-demo-001";
}
