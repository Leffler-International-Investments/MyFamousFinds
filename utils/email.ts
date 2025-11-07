// FILE: /utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || "2525");
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from =
  process.env.SMTP_FROM || (process.env.SMTP_USER ?? "no-reply@famousfinds.com");

export async function sendLoginCode(to: string, code: string) {
  console.log("🟢 Connecting to Mailtrap SMTP:", host, "Port:", port);

  if (!host || !user || !pass) {
    console.error("🔴 Missing SMTP env vars!");
    throw new Error("SMTP not configured properly.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // Mailtrap uses STARTTLS, not SSL
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false, // allow Mailtrap’s certificate
    },
  });

  const subject = "Your Famous Finds admin login code";
  const text = `Your Famous Finds login code is: ${code}`;
  const html = `
    <p>Your Famous Finds login code:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Mailtrap email sent successfully:", info.response);
  } catch (err: any) {
    console.error("❌ Mailtrap send failed:", err.message);
    throw err;
  }
}
