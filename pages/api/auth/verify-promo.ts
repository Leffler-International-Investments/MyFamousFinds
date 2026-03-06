// FILE: /pages/api/auth/verify-promo.ts
// Validates a promo code against the VITE_PROMO_CODE environment variable.
// When valid, the user bypasses payment and gets direct access to the app.

import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "crypto";

type Ok = { ok: true };
type Err = { ok: false; error: string };

/** Timing-safe string comparison to prevent timing attacks. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "method_not_allowed" });

  const { code } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ ok: false, error: "missing_code" });
  }

  // Check against VITE_PROMO_CODE (set in Vercel env vars)
  const promoCode = process.env.VITE_PROMO_CODE || "";
  if (!promoCode) {
    return res.status(503).json({ ok: false, error: "promo_not_configured" });
  }

  const trimmedCode = code.trim();
  if (safeCompare(trimmedCode, promoCode)) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: "invalid_code" });
}
