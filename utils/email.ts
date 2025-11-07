// FILE: /utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || "587");
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SMTP_USER;

if (!host || !user || !pass) {
  console.warn(
    "[email.ts] Missing SMTP env vars (SMTP_HOST, SMTP_USER, SMTP_PASS). 2FA emails will NOT be sent."
  );
}

export async function sendLoginCode(to: string, code: string) {
  if (!host || !user || !pass) {
    console.error("[email.ts] Cannot send 2FA email: SMTP not configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = "Your Famous Finds admin login code";

  const text = `Your Famous Finds admin login code is: ${code}\n\nThis code will expire shortly. If you did not request this, you can ignore this email.`;

  const html = `
    <p>Your Famous Finds admin login code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code will expire shortly. If you did not request this, you can ignore this email.</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
