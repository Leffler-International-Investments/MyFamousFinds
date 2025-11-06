// FILE: /utils/authServer.ts

import type { NextApiRequest } from "next";

/**
 * Temporary user identification helper.
 * In production you will replace this with real auth (Firebase, cookies, etc).
 */
export function getUserId(req: NextApiRequest): string | null {
  // Allow a custom header, in case you add it later
  const header = req.headers["x-user-id"] ?? req.headers["x-userid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // Fallback so APIs can run during development
  return "user-demo-001";
}

/**
 * Temporary seller identification helper.
 * Also replace this with real auth later (e.g. seller sessions).
 */
export function getSellerId(req: NextApiRequest): string | null {
  const header =
    req.headers["x-seller-id"] ??
    req.headers["x-sellerid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // Fallback seller id so seller APIs work during development
  return "seller-demo-001";
}
