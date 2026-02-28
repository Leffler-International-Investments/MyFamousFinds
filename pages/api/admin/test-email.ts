// FILE: /pages/api/admin/test-email.ts
// Diagnostic endpoint to test email configuration (AWS SES)
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";

type Data =
  | { ok: true; message: string }
  | { ok: false; error: string; details?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  // Verify admin session
  if (!requireAdmin(req, res)) return;

  const { to } = (req.body || {}) as { to?: string };
  const testTo = to || process.env.ADMIN_EMAIL || "";

  if (!testTo || !testTo.includes("@")) {
    return res.status(400).json({
      ok: false,
      error: "Missing recipient. Provide 'to' in request body or set ADMIN_EMAIL.",
    });
  }

  try {
    await sendMail(
      testTo,
      "Famous Finds — Email Test",
      `This is a test email from Famous Finds.\n\nIf you received this, your email configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
      `<p>This is a test email from <b>Famous Finds</b>.</p><p>If you received this, your email configuration is working correctly!</p><p style="color:#9ca3af;font-size:12px;">Sent at: ${new Date().toISOString()}</p>`
    );

    return res.status(200).json({
      ok: true,
      message: `Test email sent to ${testTo} via AWS SES.`,
    });
  } catch (err: any) {
    console.error("[test-email] Error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Email send failed",
      details: err?.code || undefined,
    });
  }
}
