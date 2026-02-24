// FILE: /pages/api/ups/token.ts
// Health-check endpoint — verifies UPS OAuth credentials work.
// Returns { ok: true } on success. Never exposes the actual access token.
// Requires admin/seller auth so it cannot be called publicly.
//
// GET /api/ups/token → { ok, status }

import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Require authenticated seller/admin — never expose this publicly.
  // In non-production environments, allow a test key header for terminal testing.
  const testKey = req.headers["x-ups-test-key"] as string | undefined;
  const envTestKey = process.env.UPS_TEST_KEY;
  const isDevBypass =
    process.env.NODE_ENV !== "production" &&
    envTestKey &&
    testKey === envTestKey;

  const sellerId = isDevBypass ? "__dev__" : await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const clientId = process.env.UPS_CLIENT_ID;
  const clientSecret = process.env.UPS_CLIENT_SECRET;
  const merchantId = process.env.UPS_ACCOUNT_NUMBER;
  const baseUrl = process.env.UPS_BASE_URL || "https://onlinetools.ups.com";

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      ok: false,
      error: "UPS credentials not configured (UPS_CLIENT_ID / UPS_CLIENT_SECRET)",
    });
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const resp = await fetch(`${baseUrl}/security/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(merchantId ? { "x-merchant-id": merchantId } : {}),
      },
      body: "grant_type=client_credentials",
    });

    // Never return the actual token — only confirm it works
    return res.status(resp.ok ? 200 : 400).json({
      ok: resp.ok,
      status: resp.status,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: `UPS auth request failed: ${err?.message || err}`,
    });
  }
}
