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
  const out: AdminCred[] = [];

  // Primary single-admin pair (what you added in Vercel)
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");
  if (adminEmail && adminPassword) {
    out.push({ email: adminEmail, password: adminPassword });
  }

  // Optional legacy support
  const legacyAriel = String(process.env.MANAGEMENT_ARIEL_PASSWORD || "");
  if (legacyAriel) out.push({ email: "arich1114@aol.com", password: legacyAriel });

  const legacyItai = String(process.env.MANAGEMENT_ITAI_PASSWORD || "");
  if (legacyItai) out.push({ email: "itai.leff@gmail.com", password: legacyItai });

  const legacyDan = String(process.env.MANAGEMENT_DAN_PASSWORD || "");
  if (legacyDan) out.push({ email: "leffleryd@gmail.com", password: legacyDan });

  return out;
}

/**
 * Verify password via Firebase Auth REST API (for passwords set via "Set Up Password").
 */
async function verifyFirebaseAuthPassword(
  email: string,
  password: string
): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return false;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: false,
        }),
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
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

  // Allow-list can come from MANAGEMENT_SUPER_EMAILS OR fallback to ADMIN_EMAIL
  const allow = parseAllowList(process.env.MANAGEMENT_SUPER_EMAILS);
  const fallbackAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (fallbackAdminEmail) allow.add(fallbackAdminEmail);

  // Also allow any super seller emails for management access
  const superEmails = [
    "leffleryd@gmail.com",
    "arich1114@aol.com",
    "arichspot@gmail.com",
    "ariel@arichwines.com",
    "arielspot@gmail.com",
    "itai.leff@gmail.com",
  ];
  for (const se of superEmails) allow.add(se);

  if (!allow.size) {
    return res.status(500).json({
      ok: false,
      code: "server_not_configured",
      message:
        "Missing management allow-list. Set ADMIN_EMAIL (recommended) or MANAGEMENT_SUPER_EMAILS in Vercel.",
    });
  }

  if (!allow.has(email)) {
    return res.status(403).json({
      ok: false,
      code: "not_authorised",
      message: "This email is not authorised for management access.",
    });
  }

  // 1) Check all env-var credentials (match email AND password together)
  const creds = getAdminCredentials();
  const envMatch = creds.find(
    (c) => c.email === email && c.password === password
  );

  if (envMatch) {
    return res.status(200).json({ ok: true, managementId: email });
  }

  // 2) Fallback: check password via Firebase Auth (supports "Set Up Password" flow)
  const firebaseOk = await verifyFirebaseAuthPassword(email, password);
  if (firebaseOk) {
    return res.status(200).json({ ok: true, managementId: email });
  }

  return res.status(401).json({
    ok: false,
    code: "bad_credentials",
    message: "Incorrect email or password.",
  });
}
