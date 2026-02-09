// FILE: /utils/email.ts
import nodemailer from "nodemailer";

function cleanEnv(v?: string) {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

const SMTP_HOST = cleanEnv(process.env.SMTP_HOST);
const SMTP_PORT = Number(cleanEnv(process.env.SMTP_PORT) || "587");
const SMTP_USER = cleanEnv(process.env.SMTP_USER);
const SMTP_PASS = cleanEnv(process.env.SMTP_PASS);
const SMTP_FROM =
  cleanEnv(process.env.SMTP_FROM) ||
  (SMTP_USER ? `Famous Finds <${SMTP_USER}>` : "Famous Finds <no-reply@myfamousfinds.com>");

function getTransport() {
  if (!SMTP_HOST || !SMTP_PORT) {
    throw new Error("SMTP is not configured (missing SMTP_HOST/SMTP_PORT).");
  }

  const usingAuth = Boolean(SMTP_USER && SMTP_PASS);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: usingAuth ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

export async function sendSellerInviteEmail(
  a: { to: string; businessName?: string; registerUrl: string } | string,
  b?: string,
  c?: string
) {
  let to = "";
  let businessName = "";
  let registerUrl = "";

  if (typeof a === "string") {
    to = a;
    if (c) {
      businessName = b || "";
      registerUrl = c;
    } else {
      registerUrl = b || "";
    }
  } else {
    to = a.to;
    businessName = a.businessName || "";
    registerUrl = a.registerUrl;
  }

  if (!to || !registerUrl) {
    throw new Error("sendSellerInviteEmail missing required fields (to/registerUrl).");
  }

  const subject = "MyFamousFinds — Seller Registration Link";
  const text =
    `Hello${businessName ? " " + businessName : ""},\n\n` +
    `Your seller account has been approved.\n\n` +
    `Please complete your registration here:\n${registerUrl}\n\n` +
    `If you did not request this, ignore this email.\n`;

  const html =
    `<p>Hello${businessName ? " " + businessName : ""},</p>` +
    `<p>Your seller account has been approved.</p>` +
    `<p><b>Please complete your registration here:</b><br/>` +
    `<a href="${registerUrl}">${registerUrl}</a></p>` +
    `<p>If you did not request this, ignore this email.</p>`;

  await sendMail(to, subject, text, html);
}

export async function sendSellerRejectionEmail(params: {
  to: string;
  businessName?: string;
  reason?: string;
}) {
  const to = (params.to || "").trim();
  const businessName = (params.businessName || "").trim();
  const reason = (params.reason || "").trim();

  if (!to) throw new Error("sendSellerRejectionEmail missing required field: to");

  const subject = "MyFamousFinds — Seller Application Update";
  const text =
    `Hello${businessName ? " " + businessName : ""},\n\n` +
    `Thank you for applying to become a seller on MyFamousFinds.\n\n` +
    `At this time, your application was not approved.` +
    (reason ? `\n\nReason:\n${reason}\n` : "\n\n") +
    `You are welcome to re-apply after updating your information.\n`;

  const html =
    `<p>Hello${businessName ? " " + businessName : ""},</p>` +
    `<p>Thank you for applying to become a seller on MyFamousFinds.</p>` +
    `<p><b>At this time, your application was not approved.</b></p>` +
    (reason ? `<p><b>Reason:</b><br/>${escapeHtml(reason).replace(/\n/g, "<br/>")}</p>` : "") +
    `<p>You are welcome to re-apply after updating your information.</p>`;

  await sendMail(to, subject, text, html);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working. This is a test email from MyFamousFinds.\n\nIf you received this, seller emails will send on approval.";
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
