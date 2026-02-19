// FILE: /pages/api/test-email.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { sendTestEmail } from "../../utils/email";

type Res =
  | { ok: true; sentTo: string; smtp: object }
  | { ok: false; error: string; smtp?: object };

function readBearer(req: NextApiRequest) {
  const h = req.headers.authorization;
  const v = Array.isArray(h) ? h[0] : h;
  if (!v) return "";
  return v.toLowerCase().startsWith("bearer ") ? v.slice(7).trim() : v.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminPass = String(process.env.ADMIN_PASSWORD || "").trim();
  if (!adminPass) {
    return res
      .status(500)
      .json({ ok: false, error: "ADMIN_PASSWORD is not set in Vercel env." });
  }

  // Accept auth via Bearer header, ?key= query param, or POST body { key }
  const bodyKey = req.method === "POST" ? String(req.body?.key || "").trim() : "";
  const pass = readBearer(req) || bodyKey || String(req.query.key || "").trim();
  if (!pass || pass !== adminPass) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const to = String(req.body?.to || req.query.to || "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return res.status(400).json({ ok: false, error: "Missing to email" });
  }

  // SMTP diagnostic info (no secrets)
  const smtp = {
    host: process.env.SMTP_HOST || "(not set)",
    port: process.env.SMTP_PORT || "(not set)",
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}...` : "(not set)",
    from: process.env.SMTP_FROM || "(not set)",
  };

  try {
    await sendTestEmail(to);
    return res.status(200).json({ ok: true, sentTo: to, smtp });
  } catch (e: any) {
    console.error("test-email error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Failed to send test email",
      smtp,
    });
  }
}
