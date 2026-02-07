// FILE: /pages/api/management/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; managementId: string };
type Err = {
  ok: false;
  code: "not_authorised" | "server_not_configured" | "bad_credentials";
  message: string;
};
type Resp = Ok | Err;

function parseAllowList(raw: string | undefined) {
  return new Set(
    (raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

type AdminCred = { email: string; password: string };

function getAdminCredentials(): AdminCred[] {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, code: "bad_credentials", message: "Method not allowed." });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, code: "bad_credentials", message: "Email and password are required." });
  }

  const allow = parseAllowList(process.env.MANAGEMENT_SUPER_EMAILS);
  if (!allow.size) {
    return res.status(500).json({
      ok: false,
      code: "server_not_configured",
      message: "Missing MANAGEMENT_SUPER_EMAILS env var in Vercel.",
    });
  }

  if (!allow.has(email)) {
    return res.status(403).json({
      ok: false,
      code: "not_authorised",
      message: "This email is not authorised for management access.",
    });
  }

  // Validate password against admin credentials
  const admins = getAdminCredentials();
  const admin = admins.find((a) => a.email.toLowerCase() === email);

  if (!admin || !admin.password || admin.password !== password) {
    return res.status(401).json({
      ok: false,
      code: "bad_credentials",
      message: "Incorrect email or password.",
    });
  }

  return res.status(200).json({ ok: true, managementId: email });
}
