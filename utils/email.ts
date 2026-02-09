// FILE: /utils/email.ts

import nodemailer from "nodemailer";

function env(name: string) {
  // ✅ trims hidden newlines/spaces from Vercel env UI (↵)
  return String(process.env[name] ?? "").trim();
}

export async function sendMail(to: string, subject: string, text: string) {
  const host = env("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(env("SMTP_PORT") || "587");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const fromEnv = env("SMTP_FROM");

  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASS missing (or blank after trim).");
  }

  // Gmail: 587 + STARTTLS
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 true, 587 false (STARTTLS)
    auth: { user, pass },
  });

  const from = fromEnv || user;

  await transporter.sendMail({
    from,
    to: String(to || "").trim(),
    subject,
    text,
  });
}

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working. This is a test email from MyFamousFinds.\n\nIf you received this, seller emails will send on purchase.";
  await sendMail(to, subject, text);
}

export async function sendSellerApplicationReceivedEmail(to: string) {
  const subject = "MyFamousFinds — Seller Application Received";
  const text =
    "Thanks — we received your seller application.\n\n" +
    "Our team is reviewing it now. You will receive another email once your account is approved.\n\n" +
    "MyFamousFinds";
  await sendMail(to, subject, text);
}

export async function sendAdminNewSellerApplicationEmail(adminTo: string, sellerEmail: string) {
  const subject = "MyFamousFinds — New Seller Application";
  const text =
    `A new seller application was submitted.\n\n` +
    `Seller email: ${sellerEmail}\n\n` +
    `Go to Management > Vetting Queue to review.\n`;
  await sendMail(adminTo, subject, text);
}

export async function sendSellerInviteEmail(to: string, inviteUrl: string) {
  const subject = "MyFamousFinds — Seller Approved (Action Required)";
  const text =
    "Good news — your seller account has been approved.\n\n" +
    "Please open this link to continue:\n" +
    inviteUrl +
    "\n\nMyFamousFinds";
  await sendMail(to, subject, text);
}

export async function sendLoginCode(to: string, code: string) {
  const subject = "MyFamousFinds — Your login code";
  const text =
    "Here is your 6-digit login code:\n\n" +
    code +
    "\n\nIf you did not request this, you can ignore this email.\n\n" +
    "MyFamousFinds";
  await sendMail(to, subject, text);
}
