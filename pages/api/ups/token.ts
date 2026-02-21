// FILE: /pages/api/ups/token.ts
// Test endpoint — verifies UPS OAuth credentials work.
// GET /api/ups/token → { ok, status, json }

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
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

  const resp = await fetch(`${baseUrl}/security/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(merchantId ? { "x-merchant-id": merchantId } : {}),
    },
    body: "grant_type=client_credentials",
  });

  const json = await resp.json();
  return res.status(resp.ok ? 200 : 400).json({
    ok: resp.ok,
    status: resp.status,
    json,
  });
}
