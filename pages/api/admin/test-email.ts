// FILE: /pages/api/admin/test-email.ts
// Diagnostic endpoint to test SMTP configuration
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type Data =
  | {
      ok: true;
      message: string;
      config: {
        host: string | undefined;
        port: number;
        user: string | undefined;
        from: string | undefined;
        hasPass: boolean;
      };
    }
  | { ok: false; error: string; details?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "Famous Finds <admin@myfamousfinds.com>";

  const config = {
    host,
    port,
    user,
    from,
    hasPass: !!pass,
  };

  // Check if config is missing
  if (!host || !user || !pass) {
    return res.status(400).json({
      ok: false,
      error: "SMTP not configured",
      details: `Missing: ${[
        !host && "SMTP_HOST",
        !user && "SMTP_USER",
        !pass && "SMTP_PASS",
      ]
        .filter(Boolean)
        .join(", ")}`,
    });
  }

  // Get test email from request body or use SMTP_USER
  const { to } = (req.body || {}) as { to?: string };
  const testTo = to || user;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection first
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from,
      to: testTo,
      subject: "Famous Finds - SMTP Test Email",
      text: `This is a test email from Famous Finds.\n\nIf you received this, your SMTP configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
    });

    return res.status(200).json({
      ok: true,
      message: `Test email sent to ${testTo}. Message ID: ${info.messageId}`,
      config,
    });
  } catch (err: any) {
    console.error("[test-email] SMTP error:", err);

    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown SMTP error",
      details: err?.code || err?.responseCode || undefined,
    });
  }
}
