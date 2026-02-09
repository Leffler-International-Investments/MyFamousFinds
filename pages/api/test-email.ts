// FILE: /pages/api/test-email.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { sendTestEmail } from "../../utils/email";

type Res =
  | { ok: true; sentTo: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminPass = String(process.env.ADMIN_PASSWORD || "").trim();
  const pass = String(req.query.pass || "").trim();
  const to = String(req.query.to || "").trim().toLowerCase();

  if (!adminPass) {
    return res
      .status(500)
      .json({ ok: false, error: "ADMIN_PASSWORD is not set in Vercel env." });
  }

  if (!pass || pass !== adminPass) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!to || !to.includes("@")) {
    return res.status(400).json({ ok: false, error: "Missing ?to=email" });
  }

  try {
    await sendTestEmail(to);
    return res.status(200).json({ ok: true, sentTo: to });
  } catch (e: any) {
    console.error("test-email error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Failed to send test email",
    });
  }
}
