// FILE: /pages/api/admin/test-email.ts
// Diagnostic endpoint to test email configuration.
// POST /api/admin/test-email              → tries SES first, falls back to SMTP
// POST /api/admin/test-email?transport=smtp  → forces SMTP only (bypasses SES)
// POST /api/admin/test-email?transport=ses   → forces SES only (no fallback)
// POST /api/admin/test-email?transport=diag  → returns config diagnostics (no email sent)
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";
import nodemailer from "nodemailer";

type Data =
  | { ok: true; message: string; transport?: string; details?: any }
  | { ok: false; error: string; details?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  if (!requireAdmin(req, res)) return;

  const { to } = (req.body || {}) as { to?: string };
  const transport = String(req.query.transport || req.body?.transport || "auto").toLowerCase();
  const testTo = to || process.env.ADMIN_EMAIL || "";

  if (!testTo || !testTo.includes("@")) {
    return res.status(400).json({
      ok: false,
      error: "Missing recipient. Provide 'to' in request body or set ADMIN_EMAIL.",
    });
  }

  // Diagnostics mode — show what's configured without sending anything
  if (transport === "diag") {
    const smtpHost = process.env.SMTP_HOST || "";
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpFrom = process.env.SMTP_FROM || "";
    const sesRegion = process.env.AWS_REGION || "";
    const sesKey = process.env.AWS_ACCESS_KEY_ID || "";
    const sesFrom = process.env.AWS_SES_FROM || "";

    const emailTransport = process.env.EMAIL_TRANSPORT || "auto";

    return res.status(200).json({
      ok: true,
      message: "Email transport diagnostics (no email sent)",
      details: {
        transport: emailTransport,
        ses: {
          configured: Boolean(sesRegion && sesKey),
          region: sesRegion || "(not set)",
          accessKeyId: sesKey ? `${sesKey.slice(0, 4)}...${sesKey.slice(-4)}` : "(not set)",
          from: sesFrom || "(not set)",
        },
        smtp: {
          configured: Boolean(smtpHost && smtpUser),
          host: smtpHost || "(not set)",
          port: process.env.SMTP_PORT || "587",
          user: smtpUser || "(not set)",
          pass: smtpPass ? `${"*".repeat(Math.min(smtpPass.length, 16))} (${smtpPass.length} chars)` : "(not set)",
          from: smtpFrom || "(not set)",
        },
        recipient: testTo,
      },
    });
  }

  // SMTP-only mode — bypass SES entirely to debug Google Workspace
  if (transport === "smtp") {
    const smtpHost = process.env.SMTP_HOST || "";
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpFrom = process.env.SMTP_FROM || `Famous Finds <${smtpUser}>`;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({
        ok: false,
        error: "SMTP not fully configured",
        details: {
          host: smtpHost || "(not set)",
          user: smtpUser || "(not set)",
          pass: smtpPass ? "(set)" : "(not set)",
        },
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Verify the SMTP connection first
      await transporter.verify();

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: testTo,
        subject: "Famous Finds — SMTP Test (Google Workspace)",
        text: `This is a test email sent directly via SMTP (Google Workspace).\n\nFrom: ${smtpFrom}\nTo: ${testTo}\nHost: ${smtpHost}:${smtpPort}\n\nSent at: ${new Date().toISOString()}`,
        html: `<p>This is a test email sent directly via <b>SMTP (Google Workspace)</b>.</p>
          <p>From: ${smtpFrom}<br/>To: ${testTo}<br/>Host: ${smtpHost}:${smtpPort}</p>
          <p style="color:#9ca3af;font-size:12px;">Sent at: ${new Date().toISOString()}</p>`,
      });

      return res.status(200).json({
        ok: true,
        message: `Test email sent to ${testTo} via SMTP (${smtpHost}).`,
        transport: "smtp",
        details: { messageId: info.messageId, host: smtpHost, user: smtpUser },
      });
    } catch (err: any) {
      console.error("[test-email] SMTP-only test FAILED:", err);
      return res.status(500).json({
        ok: false,
        error: `SMTP failed: ${err?.message || "Unknown error"}`,
        details: {
          code: err?.code,
          command: err?.command,
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
        },
      });
    }
  }

  // Default (auto) or SES-only mode
  try {
    await sendMail(
      testTo,
      "Famous Finds — Email Test",
      `This is a test email from Famous Finds.\n\nIf you received this, your email configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
      `<p>This is a test email from <b>Famous Finds</b>.</p><p>If you received this, your email configuration is working correctly!</p><p style="color:#9ca3af;font-size:12px;">Sent at: ${new Date().toISOString()}</p>`
    );

    return res.status(200).json({
      ok: true,
      message: `Test email sent to ${testTo}.`,
      transport: transport === "ses" ? "ses" : "auto (SES → SMTP fallback)",
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
