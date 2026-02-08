// FILE: /pages/api/management/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; managementId: string };
type Err = {
  ok: false;
  code: "not_authorised" | "server_not_configured" | "bad_credentials";
  message: string;
};
type Resp = Ok | Err;

function parseCsv(raw: string | undefined) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function buildAllowList(): Set<string> {
  // Union allow-list (supports both new and legacy env vars)
  const fromManagement = parseCsv(process.env.MANAGEMENT_SUPER_EMAILS);
  const fromAdminEmails = parseCsv(process.env.ADMIN_EMAILS);
  const single = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  const combined = [
    ...fromManagement,
    ...fromAdminEmails,
    ...(single ? [single] : []),
  ].filter(Boolean);

  return new Set(combined);
}

type AdminCred = { email: string; password: string };

// Legacy per-admin password support (kept for existing setups)
function getLegacyAdminCredentials(): AdminCred[] {
  return [
    {
      email: "arich1114@aol.com",
      password: process.env.MANAGEMENT_ARIEL_PASSWORD || "",
    },
    {
      email: "leffleryd@gmail.com",
      password: process.env.MANAGEMENT_DAN_PASSWORD || "",
    },
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, code: "bad_credentials", message: "Method not allowed." });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email and password are required.",
    });
  }

  const allow = buildAllowList();
  if (!allow.size) {
    return res.status(500).json({
      ok: false,
      code: "server_not_configured",
      message:
        "Missing management allow-list env var. Set MANAGEMENT_SUPER_EMAILS (recommended) or ADMIN_EMAIL / ADMIN_EMAILS in Vercel.",
    });
  }

  if (!allow.has(email)) {
    return res.status(403).json({
      ok: false,
      code: "not_authorised",
      message: "This email is not authorised for management access.",
    });
  }

  // ✅ Preferred: one shared management password for all allowed emails
  const sharedPassword = String(process.env.ADMIN_PASSWORD || "");
  if (sharedPassword) {
    if (password !== sharedPassword) {
      return res.status(401).json({
        ok: false,
        code: "bad_credentials",
        message: "Incorrect email or password.",
      });
    }
    return res.status(200).json({ ok: true, managementId: email });
  }

  // Legacy: per-email passwords (kept for existing configs)
  const legacyAdmins = getLegacyAdminCredentials();
  const admin = legacyAdmins.find((a) => a.email.toLowerCase() === email);

  if (!admin || !admin.password || admin.password !== password) {
    return res.status(401).json({
      ok: false,
      code: "bad_credentials",
      message: "Incorrect email or password.",
    });
  }

  return res.status(200).json({ ok: true, managementId: email });
}
