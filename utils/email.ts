// FILE: /utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || "2525");
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from =
  process.env.SMTP_FROM || (process.env.SMTP_USER ?? "no-reply@famousfinds.com");

export async function sendLoginCode(to: string, code: string) {
  if (!host || !user || !pass) {
    throw new Error("SMTP not configured properly.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // ✅ important for Mailtrap
    auth: { user, pass },
  });

  const subject = "Your Famous Finds admin login code";
  const text = `Your Famous Finds login code is: ${code}`;
  const html = `<p>Your Famous Finds login code:</p>
                <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>`;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
