// FILE: /utils/authServer.ts
import type { NextApiRequest } from "next";

/**
 * Temporary seller identification helper.
 * Replace with real auth later.
 */
export function getSellerId(req: NextApiRequest): string | null {
  const header = req.headers["x-seller-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  // Fallback so APIs work for now
  return "seller-demo-001";
}
