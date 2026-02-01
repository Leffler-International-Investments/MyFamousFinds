// FILE: /pages/api/management/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type Ok = { ok: true; managementId: string };
type Err = {
  ok: false;
  code: "not_authorised" | "pending" | "bad_credentials" | "server_not_configured";
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

function isApprovedStatus(status: unknown) {
  const s = String(status || "").trim().toLowerCase();
  return s === "approved";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      code: "bad_credentials",
      message: "Method not allowed.",
    });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email is required.",
    });
  }

  const superEmails = parseAllowList(process.env.MANAGEMENT_SUPER_EMAILS);

  // ✅ Owners bypass database checks (recommended)
  if (superEmails.has(email)) {
    return res.status(200).json({ ok: true, managementId: email });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({
      ok: false,
      code: "server_not_configured",
      message:
        "Server is not configured (missing Firebase Admin env vars). Please set FB_PROJECT_ID / FB_CLIENT_EMAIL / FB_PRIVATE_KEY in Vercel.",
    });
  }

  try {
    // Optional: allow “managementAdmins” collection if you use it
    const snap = await adminDb.collection("managementAdmins").doc(email).get();

    if (!snap.exists) {
      return res.status(403).json({
        ok: false,
        code: "not_authorised",
        message: "This email is not authorised for management access.",
      });
    }

    const data = snap.data() || {};
    if (!isApprovedStatus(data.status)) {
      return res.status(403).json({
        ok: false,
        code: "pending",
        message: "Your management access is not approved yet.",
      });
    }

    return res.status(200).json({ ok: true, managementId: email });
  } catch (e) {
    console.error("management_login_api_error", e);
    return res.status(500).json({
      ok: false,
      code: "bad_credentials",
      message: "Unexpected server error. Please try again.",
    });
  }
}
