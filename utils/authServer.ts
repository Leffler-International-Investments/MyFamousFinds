// FILE: /utils/authServer.ts

import type { NextApiRequest } from "next";

/**
 * User identification helper.
 * Reads the x-user-id header set by the client after Firebase Auth login.
 * Returns null when no valid identity is present.
 */
export function getUserId(req: NextApiRequest): string | null {
  const header = req.headers["x-user-id"] ?? req.headers["x-userid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  return null;
}

/**
 * Seller identification helper.
 * Reads the x-seller-id header set by the seller dashboard client.
 * Returns null when no valid identity is present.
 */
export function getSellerId(req: NextApiRequest): string | null {
  const header =
    req.headers["x-seller-id"] ??
    req.headers["x-sellerid"];

  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  return null;
}
