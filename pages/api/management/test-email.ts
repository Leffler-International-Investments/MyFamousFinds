// FILE: /pages/api/management/test-email.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { sendTestEmail } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    const { to } = (req.body || {}) as { to?: string };
    if (!to || !String(to).includes("@")) return res.status(400).json({ ok: false, error: "missing_fields" });

    await sendTestEmail(String(to));
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("test-email error", e);
    return res.status(500).json({ ok: false, error: e?.message || "server_error" });
  }
}
