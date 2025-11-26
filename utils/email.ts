// FILE: /utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;

if (!host || !user || !pass) {
  console.warn(
    "[email] Missing SMTP configuration. Emails will NOT be sent.",
    { host, user }
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 465 = SSL, 587 = STARTTLS
  auth: user && pass ? { user, pass } : undefined,
});

/**
 * Send the 6-digit login code to an admin/seller email.
 */
export async function sendLoginCode(to: string, code: string) {
  if (!host || !user || !pass) {
    console.warn("[email] sendLoginCode skipped – SMTP not configured");
    return;
  }

  const mailOptions = {
    from,
    to,
    subject: "Your Famous Finds verification code",
    text: `Your login verification code is: ${code}\n\nIf you did not request this, you can ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}
