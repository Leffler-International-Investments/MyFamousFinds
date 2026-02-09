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
  (SMTP_USER
    ? `Famous Finds <${SMTP_USER}>`
    : "Famous Finds <no-reply@myfamousfinds.com>");

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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const transport = getTransport();
  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

/**
 * 2FA / Login Code email (used by /pages/api/auth/start-2fa.ts)
 */
export async function sendLoginCode(to: string, code: string) {
  const email = String(to || "").trim();
  const c = String(code || "").trim();

  if (!email) throw new Error("sendLoginCode missing required field: to");
  if (!c) throw new Error("sendLoginCode missing required field: code");

  const subject = "MyFamousFinds — Your Login Code";
  const text =
    "Hello,\n\n" +
    "Use the login code below to sign in:\n\n" +
    `${c}\n\n` +
    "If you did not request this, you can ignore this email.\n\n" +
    "MyFamousFinds";

  const html =
    "<p>Hello,</p>" +
    "<p>Use the login code below to sign in:</p>" +
    `<p style="font-size:20px; letter-spacing:2px;"><b>${escapeHtml(
      c
    )}</b></p>` +
    "<p>If you did not request this, you can ignore this email.</p>" +
    "<p>MyFamousFinds</p>";

  await sendMail(email, subject, text, html);
}

/**
 * Seller Application — confirmation to the seller (application received)
 */
export async function sendSellerApplicationReceivedEmail(to: string) {
  const email = String(to || "").trim();
  if (!email) throw new Error("sendSellerApplicationReceivedEmail missing required field: to");

  const subject = "MyFamousFinds — Application Received";
  const text =
    "Hello,\n\n" +
    "Thanks for applying to become a seller on MyFamousFinds.\n\n" +
    "We have received your application and our team will review it shortly.\n\n" +
    "You will receive another email once your application has been approved or if we need more information.\n\n" +
    "Regards,\n" +
    "MyFamousFinds";

  const html =
    "<p>Hello,</p>" +
    "<p>Thanks for applying to become a seller on <b>MyFamousFinds</b>.</p>" +
    "<p>We have received your application and our team will review it shortly.</p>" +
    "<p>You will receive another email once your application has been approved or if we need more information.</p>" +
    "<p>Regards,<br/>MyFamousFinds</p>";

  await sendMail(email, subject, text, html);
}

/**
 * Seller Application — notification to admin (new seller application received)
 */
export async function sendAdminNewSellerApplicationEmail(
  adminTo: string,
  sellerEmail: string
) {
  const to = String(adminTo || "").trim();
  const seller = String(sellerEmail || "").trim().toLowerCase();

  if (!to) throw new Error("sendAdminNewSellerApplicationEmail missing required field: adminTo");
  if (!seller || !seller.includes("@")) {
    throw new Error("sendAdminNewSellerApplicationEmail missing/invalid sellerEmail");
  }

  const subject = "MyFamousFinds — New Seller Application";
  const text =
    "Hello,\n\n" +
    "A new seller application has been submitted.\n\n" +
    `Seller email: ${seller}\n\n` +
    "Please review it in the Management Dashboard.\n\n" +
    "MyFamousFinds";

  const html =
    "<p>Hello,</p>" +
    "<p><b>A new seller application has been submitted.</b></p>" +
    `<p><b>Seller email:</b> ${escapeHtml(seller)}</p>` +
    "<p>Please review it in the Management Dashboard.</p>" +
    "<p>MyFamousFinds</p>";

  await sendMail(to, subject, text, html);
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
    (reason
      ? `<p><b>Reason:</b><br/>${escapeHtml(reason).replace(/\n/g, "<br/>")}</p>`
      : "") +
    `<p>You are welcome to re-apply after updating your information.</p>`;

  await sendMail(to, subject, text, html);
}

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working. This is a test email from MyFamousFinds.\n\nIf you received this, seller emails will send on approval.";
  await sendMail(to, subject, text);
}
