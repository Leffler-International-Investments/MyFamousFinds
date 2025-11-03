// FILE: /utils/authServer.ts
import type { NextApiRequest } from "next";

// Replace with your real session/cookie decode.
// For now, allow header override for testing: `x-seller-id`.
export function getSellerId(req: NextApiRequest): string {
  return (req.headers["x-seller-id"] as string) || "seller-demo-001";
}

export function getUserId(req: NextApiRequest): string {
  // Buyer or current user; fallback to same value for demo
  return (req.headers["x-user-id"] as string) || "user-demo-001";
}
