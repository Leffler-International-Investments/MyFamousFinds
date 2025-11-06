// FILE: /utils/authServer.ts

import type { NextApiRequest } from "next";

/**
 * Temporary seller identification helper.
 * In a real deployment you will replace this with proper auth
 * (Firebase auth, session cookies, etc).
 */
export function getSellerId(req: NextApiRequest): string | null {
  // Example of reading a header if you add one later:
  const header = req.headers["x-seller-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // For now, fall back to a demo seller id so APIs work.
  return "seller-demo-001";
}
