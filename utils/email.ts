// FILE: /utils/email.ts
// Email transport: AWS SES (primary) with Gmail SMTP fallback.
import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function cleanEnv(v?: string) {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

// ---------- AWS SES config ----------
const AWS_REGION = cleanEnv(process.env.AWS_REGION) || "us-east-1";
const AWS_ACCESS_KEY_ID = cleanEnv(process.env.AWS_ACCESS_KEY_ID);
const AWS_SECRET_ACCESS_KEY = cleanEnv(process.env.AWS_SECRET_ACCESS_KEY);
// SES sender must be a verified identity in AWS — NEVER fall back to SMTP_FROM
// (which is typically a personal Gmail and will be rejected by SES).
const AWS_SES_FROM =
  cleanEnv(process.env.AWS_SES_FROM) ||
  "Famous Finds <admin@myfamousfinds.com>";
const AWS_SES_REPLY_TO =
  cleanEnv(process.env.AWS_SES_REPLY_TO) ||
  "Famous Finds Support <support@myfamousfinds.com>";

function isSesConfigured(): boolean {
  return Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

function getSesClient() {
  return new SESClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

// ---------- SMTP (Gmail) config ----------
const SMTP_HOST = cleanEnv(process.env.SMTP_HOST);
const SMTP_PORT = Number(cleanEnv(process.env.SMTP_PORT) || "587");
const SMTP_USER = cleanEnv(process.env.SMTP_USER);
const SMTP_PASS = cleanEnv(process.env.SMTP_PASS);
const SMTP_FROM_RAW = cleanEnv(process.env.SMTP_FROM);

/**
 * Parse a "Display Name <email>" string into its parts.
 */
function parseFromAddress(raw: string): { name: string; email: string } | null {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (raw.includes("@")) return { name: "", email: raw.trim() };
  return null;
}

const parsed = SMTP_FROM_RAW ? parseFromAddress(SMTP_FROM_RAW) : null;
const fromDisplayName = parsed?.name || "Famous Finds";
const fromEmail = parsed?.email || "";

const SMTP_FROM = SMTP_FROM_RAW
  ? (parsed?.name
      ? `${parsed.name} <${parsed.email}>`
      : parsed?.email || SMTP_FROM_RAW)
  : "Famous Finds <admin@myfamousfinds.com>";

const SMTP_REPLY_TO = "Famous Finds Support <support@myfamousfinds.com>";

function getSmtpTransport() {
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

// ---------- Shared helpers ----------

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Send email via AWS SES.
 */
async function sendViaSes(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const parsedFrom = parseFromAddress(AWS_SES_FROM);
  const sourceEmail = parsedFrom?.email || AWS_SES_FROM;
  // SES requires the From to be a verified identity (domain or email)
  const source = parsedFrom?.name
    ? `${parsedFrom.name} <${sourceEmail}>`
    : sourceEmail;

  console.log(`[SES] Sending from="${source}" to="${to}" subject="${subject}"`);

  const client = getSesClient();
  const command = new SendEmailCommand({
    Source: source,
    ReplyToAddresses: [AWS_SES_REPLY_TO],
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: text, Charset: "UTF-8" },
        ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
      },
    },
  });

  try {
    const result = await client.send(command);
    return { messageId: result.MessageId || "n/a" };
  } catch (err: any) {
    const msg = err?.message || "";
    // Provide clear guidance for common SES errors
    if (msg.includes("not verified") || msg.includes("identity")) {
      console.error(
        `[SES] IDENTITY NOT VERIFIED — The sender "${sourceEmail}" is not verified in AWS SES (region: ${AWS_REGION}).`,
        `\nFix: In Vercel, set AWS_SES_FROM to a verified SES identity (e.g. noreply@myfamousfinds.com).`,
        `\nAlso ensure the domain or email is verified in the AWS SES console.`,
        `\nIf SES is in sandbox mode, the recipient "${to}" must also be verified.`
      );
    }
    throw err;
  }
}

/**
 * Send email via SMTP (Gmail fallback).
 */
async function sendViaSmtp(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const transport = getSmtpTransport();
  const info = await transport.sendMail({
    from: SMTP_FROM,
    ...(SMTP_REPLY_TO ? { replyTo: SMTP_REPLY_TO } : {}),
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  return { messageId: info.messageId ?? "n/a" };
}

/**
 * Main sendMail — uses AWS SES when configured.
 * SMTP is only used when SES credentials are NOT set at all (local dev).
 * When SES IS configured, failures are thrown — never silently fall back
 * to Gmail/SMTP so that production emails always come from the verified
 * AWS SES domain (admin@myfamousfinds.com).
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const logTag = `[EMAIL] to=${to} subject="${subject}"`;
  console.log(`${logTag} — attempting to send`);

  // AWS SES is the primary (and production) transport
  if (isSesConfigured()) {
    const result = await sendViaSes(to, subject, text, html);
    console.log(`${logTag} — sent via AWS SES (messageId=${result.messageId})`);
    return result;
  }

  // SMTP only used in local dev when SES credentials are not set
  console.warn(`${logTag} — AWS SES not configured, using SMTP fallback (dev only)`);
  try {
    const result = await sendViaSmtp(to, subject, text, html);
    console.log(`${logTag} — sent via SMTP (messageId=${result.messageId})`);
    return result;
  } catch (err) {
    console.error(`${logTag} — SMTP FAILED`, err);
    throw err;
  }
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
export async function sendSellerApplicationReceivedEmail(
  to: string,
  details?: {
    businessName?: string;
    contactName?: string;
    phone?: string;
    website?: string;
    social?: string;
    inventory?: string;
    experience?: string;
  }
) {
  const email = String(to || "").trim();
  if (!email) throw new Error("sendSellerApplicationReceivedEmail missing required field: to");

  const d = details || {};
  const greeting = d.contactName ? `Hello ${escapeHtml(d.contactName)}` : "Hello";

  // Build a plain-text summary of submitted details
  const summaryLines: string[] = [];
  if (d.businessName) summaryLines.push(`  Business Name: ${d.businessName}`);
  if (d.contactName) summaryLines.push(`  Contact Name: ${d.contactName}`);
  summaryLines.push(`  Email: ${email}`);
  if (d.phone) summaryLines.push(`  Phone: ${d.phone}`);
  if (d.website) summaryLines.push(`  Website: ${d.website}`);
  if (d.social) summaryLines.push(`  Social: ${d.social}`);
  if (d.inventory) summaryLines.push(`  Inventory: ${d.inventory}`);
  if (d.experience) summaryLines.push(`  Experience: ${d.experience}`);
  const summaryText = summaryLines.join("\n");

  // Build an HTML summary table
  const summaryRows: string[] = [];
  if (d.businessName)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Business Name</td><td style="padding:4px 8px;">${escapeHtml(d.businessName)}</td></tr>`);
  if (d.contactName)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Contact Name</td><td style="padding:4px 8px;">${escapeHtml(d.contactName)}</td></tr>`);
  summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Email</td><td style="padding:4px 8px;">${escapeHtml(email)}</td></tr>`);
  if (d.phone)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Phone</td><td style="padding:4px 8px;">${escapeHtml(d.phone)}</td></tr>`);
  if (d.website)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Website</td><td style="padding:4px 8px;">${escapeHtml(d.website)}</td></tr>`);
  if (d.social)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Social</td><td style="padding:4px 8px;">${escapeHtml(d.social)}</td></tr>`);
  if (d.inventory)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Inventory</td><td style="padding:4px 8px;">${escapeHtml(d.inventory)}</td></tr>`);
  if (d.experience)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Experience</td><td style="padding:4px 8px;">${escapeHtml(d.experience)}</td></tr>`);
  const summaryHtml = summaryRows.length
    ? `<table style="border-collapse:collapse;margin:8px 0;font-size:14px;">${summaryRows.join("")}</table>`
    : "";

  const subject = "MyFamousFinds — Application Received";
  const text =
    `${greeting.replace(/<[^>]*>/g, "")},\n\n` +
    "Thank you for applying to become a seller on MyFamousFinds!\n\n" +
    "We have received your application with the following details:\n\n" +
    summaryText + "\n\n" +
    "Your application is under review. You will be notified once vetted.\n\n" +
    "If you have any questions in the meantime, feel free to reply to this email.\n\n" +
    "Regards,\n" +
    "The MyFamousFinds Team";

  const html =
    `<p>${greeting},</p>` +
    "<p>Thank you for applying to become a seller on <b>MyFamousFinds</b>!</p>" +
    "<p>We have received your application with the following details:</p>" +
    summaryHtml +
    `<p style="margin-top:12px;padding:10px;background:#f0fdf4;border-radius:6px;font-size:14px;">` +
    "<b>Your application is under review.</b> You will be notified once vetted.</p>" +
    "<p>If you have any questions in the meantime, feel free to reply to this email.</p>" +
    "<p>Regards,<br/>The MyFamousFinds Team</p>";

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

  const loginUrl = registerUrl.replace(/\/seller\/register.*$/, "/seller/login");
  const subject = "Famous Finds — Your Seller Account Has Been Approved!";
  const text =
    `Hello${businessName ? " " + businessName : ""},\n\n` +
    `Great news — your seller account on Famous Finds has been approved!\n\n` +
    `Let's start building your Famous Closet.\n\n` +
    `If you need assistance pricing your items, let us know and one of our specialists will schedule a virtual appointment with you.\n\n` +
    `Login here - ${loginUrl} and complete the registration process.\n\n` +
    `Welcome aboard!\n` +
    `The Famous Finds Team\n`;

  const html =
    `<p>Hello${businessName ? " " + escapeHtml(businessName) : ""},</p>` +
    `<p style="font-size:16px;"><b>Great news — your seller account on Famous Finds has been approved!</b></p>` +
    `<p>Let&#39;s start building your Famous Closet.</p>` +
    `<p>If you need assistance pricing your items, let us know and one of our specialists will schedule a virtual appointment with you.</p>` +
    `<p>Login here - <a href="${loginUrl}" style="color:#059669;">${escapeHtml(loginUrl)}</a> and complete the registration process.</p>` +
    `<p>Welcome aboard!<br/>The Famous Finds Team</p>`;

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
    `Thank you for your interest in becoming a seller on MyFamousFinds.\n\n` +
    `After reviewing your application, we are unable to approve it at this time.` +
    (reason ? `\n\nFeedback from our team:\n${reason}\n` : "\n") +
    `\nWe appreciate the time you took to apply. You are welcome to re-apply at any time ` +
    `by visiting our "Become a Seller" page and submitting an updated application.\n\n` +
    `If you have questions, feel free to reply to this email.\n\n` +
    `Regards,\n` +
    `The MyFamousFinds Team\n`;

  const html =
    `<p>Hello${businessName ? " " + escapeHtml(businessName) : ""},</p>` +
    `<p>Thank you for your interest in becoming a seller on <b>MyFamousFinds</b>.</p>` +
    `<p>After reviewing your application, we are unable to approve it at this time.</p>` +
    (reason
      ? `<p style="padding:10px;background:#fef3c7;border-radius:6px;"><b>Feedback from our team:</b><br/>${escapeHtml(reason).replace(/\n/g, "<br/>")}</p>`
      : "") +
    `<p>We appreciate the time you took to apply. You are welcome to <b>re-apply at any time</b> ` +
    `by visiting our "Become a Seller" page and submitting an updated application.</p>` +
    `<p>If you have questions, feel free to reply to this email.</p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Buyer — order confirmation email
 */
export async function sendBuyerOrderConfirmationEmail(params: {
  to: string;
  buyerName?: string;
  orderId: string;
  itemTitle: string;
  amount: string;
  currency?: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendBuyerOrderConfirmationEmail missing required field: to");

  const name = params.buyerName || "there";
  const subject = "MyFamousFinds — Order Confirmation";
  const text =
    `Hello ${name},\n\n` +
    `Thank you for your purchase on MyFamousFinds!\n\n` +
    `Order ID: ${params.orderId}\n` +
    `Item: ${params.itemTitle}\n` +
    `Total: ${params.currency || "USD"} ${params.amount}\n\n` +
    `We will process your order and keep you updated on shipping.\n\n` +
    `If you have any questions, feel free to reply to this email.\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>Thank you for your purchase on <b>MyFamousFinds</b>!</p>` +
    `<div style="padding:12px;background:#f0fdf4;border-radius:6px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Order ID:</b> ${escapeHtml(params.orderId)}</p>` +
    `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    `<p style="margin:4px 0;"><b>Total:</b> ${escapeHtml(params.currency || "USD")} ${escapeHtml(params.amount)}</p>` +
    `</div>` +
    `<p>We will process your order and keep you updated on shipping.</p>` +
    `<p>If you have any questions, feel free to reply to this email.</p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Seller — item sold notification email
 */
export async function sendSellerItemSoldEmail(params: {
  to: string;
  sellerName?: string;
  itemTitle: string;
  amount: string;
  currency?: string;
  orderId: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendSellerItemSoldEmail missing required field: to");

  const name = params.sellerName || "Seller";
  const subject = "MyFamousFinds — Your Item Has Been Sold!";
  const text =
    `Hello ${name},\n\n` +
    `Great news — your item has been sold on MyFamousFinds!\n\n` +
    `Item: ${params.itemTitle}\n` +
    `Sale Amount: ${params.currency || "USD"} ${params.amount}\n` +
    `Order ID: ${params.orderId}\n\n` +
    `Please prepare the item for shipping. You can view the order details ` +
    `in your Seller Dashboard.\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p style="font-size:16px;"><b>Great news — your item has been sold on MyFamousFinds!</b></p>` +
    `<div style="padding:12px;background:#fef3c7;border-radius:6px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    `<p style="margin:4px 0;"><b>Sale Amount:</b> ${escapeHtml(params.currency || "USD")} ${escapeHtml(params.amount)}</p>` +
    `<p style="margin:4px 0;"><b>Order ID:</b> ${escapeHtml(params.orderId)}</p>` +
    `</div>` +
    `<p>Please prepare the item for shipping. You can view the order details in your Seller Dashboard.</p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Dynamic pricing suggestion — notify seller of 7-day no-view listing
 */
export async function sendPricingSuggestionEmail(params: {
  to: string;
  sellerName: string;
  itemTitle: string;
  currentPrice: number;
  suggestedPrice5: number;
  suggestedPrice10: number;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendPricingSuggestionEmail missing required field: to");

  const name = params.sellerName || "Seller";
  const subject = `MyFamousFinds — Pricing Suggestion for "${params.itemTitle}"`;
  const text =
    `Hello ${name},\n\n` +
    `Your listing "${params.itemTitle}" has been live for over 7 days without views.\n\n` +
    `Current price: US$${params.currentPrice.toLocaleString()}\n` +
    `Suggested (5% off): US$${params.suggestedPrice5.toLocaleString()}\n` +
    `Suggested (10% off): US$${params.suggestedPrice10.toLocaleString()}\n\n` +
    `Market-competitive pricing helps items sell faster.\n\n` +
    `Regards,\nThe MyFamousFinds Team`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>Your listing <b>"${escapeHtml(params.itemTitle)}"</b> has been live for over 7 days without views.</p>` +
    `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Current price:</b> US$${params.currentPrice.toLocaleString()}</p>` +
    `<p style="margin:4px 0;"><b>Suggested (5% off):</b> US$${params.suggestedPrice5.toLocaleString()}</p>` +
    `<p style="margin:4px 0;"><b>Suggested (10% off):</b> US$${params.suggestedPrice10.toLocaleString()}</p>` +
    `</div>` +
    `<p>Market-competitive pricing helps items sell faster.</p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Re-engagement campaign — invite previous buyers to consign
 */
export async function sendReengagementEmail(params: {
  to: string;
  buyerName: string;
  itemDescription: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendReengagementEmail missing required field: to");

  const name = params.buyerName || "there";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";

  const subject = `Ready to consign that ${params.itemDescription}?`;
  const text =
    `Hello ${name},\n\n` +
    `It's been a while since you purchased "${params.itemDescription}" on Famous Finds.\n\n` +
    `Ready to consign it? Pre-loved luxury is in demand.\n\n` +
    `Start here: ${siteUrl}/become-seller\n\n` +
    `Regards,\nThe Famous Finds Team`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>It's been a while since you purchased <b>"${escapeHtml(params.itemDescription)}"</b>.</p>` +
    `<p>Ready to consign it? Pre-loved luxury is in demand.</p>` +
    `<p><a href="${siteUrl}/become-seller" ` +
    `style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">Start Consigning</a></p>` +
    `<p>Regards,<br/>The Famous Finds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Post-purchase review request — sent after delivery
 */
export async function sendReviewRequestEmail(params: {
  to: string;
  buyerName?: string;
  itemTitle: string;
  orderId: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendReviewRequestEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.buyerName || "there";
  const subject = "How was your Famous Finds experience?";

  const text =
    `Hello ${name},\n\n` +
    `We hope you are enjoying your "${params.itemTitle}"!\n\n` +
    `We would love to hear about your experience. Your review helps other buyers ` +
    `discover authenticated luxury items on Famous Finds.\n\n` +
    `Leave a review: ${siteUrl}/reviews\n\n` +
    `Thank you for shopping with us!\n\n` +
    `Regards,\nThe Famous Finds Team`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>We hope you are enjoying your <b>"${escapeHtml(params.itemTitle)}"</b>!</p>` +
    `<p>We would love to hear about your experience. Your review helps other buyers ` +
    `discover authenticated luxury items on Famous Finds.</p>` +
    `<p><a href="${siteUrl}/reviews" ` +
    `style="display:inline-block;padding:12px 28px;background:#111827;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">Leave a Review</a></p>` +
    `<p>Thank you for shopping with us!</p>` +
    `<p>Regards,<br/>The Famous Finds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Wishlist price drop alert — notify buyer when a wishlisted item's price drops
 */
export async function sendWishlistPriceDropEmail(params: {
  to: string;
  buyerName?: string;
  itemTitle: string;
  oldPrice: number;
  newPrice: number;
  currency?: string;
  listingId: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendWishlistPriceDropEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.buyerName || "there";
  const cur = params.currency || "USD";
  const subject = `Price Drop — "${params.itemTitle}" is now ${cur} $${params.newPrice.toLocaleString()}`;

  const text =
    `Hello ${name},\n\n` +
    `Great news! An item on your wishlist just dropped in price.\n\n` +
    `Item: ${params.itemTitle}\n` +
    `Was: ${cur} $${params.oldPrice.toLocaleString()}\n` +
    `Now: ${cur} $${params.newPrice.toLocaleString()}\n\n` +
    `View it here: ${siteUrl}/product/${params.listingId}\n\n` +
    `Regards,\nThe Famous Finds Team`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>Great news! An item on your wishlist just dropped in price.</p>` +
    `<div style="padding:14px;background:#d1fae5;border-radius:8px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    `<p style="margin:4px 0;"><b>Was:</b> <s>${escapeHtml(cur)} $${params.oldPrice.toLocaleString()}</s></p>` +
    `<p style="margin:4px 0;font-size:18px;"><b>Now:</b> ${escapeHtml(cur)} $${params.newPrice.toLocaleString()}</p>` +
    `</div>` +
    `<p><a href="${siteUrl}/product/${params.listingId}" ` +
    `style="display:inline-block;padding:12px 28px;background:#16a34a;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">View Item</a></p>` +
    `<p>Regards,<br/>The Famous Finds Team</p>`;

  await sendMail(to, subject, text, html);
}

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working. This is a test email from MyFamousFinds.\n\nIf you received this, seller emails will send on approval.";
  await sendMail(to, subject, text);
}

/**
 * Offer — notify seller of a new offer on their listing
 */
export async function sendSellerNewOfferEmail(params: {
  to: string;
  sellerName?: string;
  buyerEmail: string;
  itemTitle: string;
  offerAmount: number;
  listingPrice?: number;
  currency?: string;
  message?: string;
  offerId: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendSellerNewOfferEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.sellerName || "Seller";
  const cur = params.currency || "USD";
  const subject = `MyFamousFinds — New Offer on "${params.itemTitle}"`;

  const text =
    `Hello ${name},\n\n` +
    `You have received a new offer on your listing!\n\n` +
    `Item: ${params.itemTitle}\n` +
    (params.listingPrice ? `Listing price: ${cur} $${params.listingPrice.toLocaleString()}\n` : "") +
    `Offer amount: ${cur} $${params.offerAmount.toLocaleString()}\n` +
    `Buyer: ${params.buyerEmail}\n` +
    (params.message ? `Message: ${params.message}\n` : "") +
    `\nView and respond to this offer in your Seller Dashboard:\n` +
    `${siteUrl}/seller/offers\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p style="font-size:16px;"><b>You have received a new offer on your listing!</b></p>` +
    `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    (params.listingPrice ? `<p style="margin:4px 0;"><b>Listing price:</b> ${escapeHtml(cur)} $${params.listingPrice.toLocaleString()}</p>` : "") +
    `<p style="margin:4px 0;"><b>Offer amount:</b> ${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</p>` +
    `<p style="margin:4px 0;"><b>Buyer:</b> ${escapeHtml(params.buyerEmail)}</p>` +
    (params.message ? `<p style="margin:4px 0;"><b>Message:</b> ${escapeHtml(params.message)}</p>` : "") +
    `</div>` +
    `<p><a href="${siteUrl}/seller/offers" ` +
    `style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">View Offers</a></p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Offer — notify buyer that their offer was accepted
 */
export async function sendBuyerOfferAcceptedEmail(params: {
  to: string;
  buyerName?: string;
  itemTitle: string;
  offerAmount: number;
  currency?: string;
  listingId?: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendBuyerOfferAcceptedEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.buyerName || "there";
  const cur = params.currency || "USD";
  const paymentUrl = params.listingId
    ? `${siteUrl}/product/${params.listingId}`
    : siteUrl;
  const subject = `MyFamousFinds — Your Offer on "${params.itemTitle}" Was Accepted!`;

  const text =
    `Hello ${name},\n\n` +
    `Great news — your offer has been accepted!\n\n` +
    `Item: ${params.itemTitle}\n` +
    `Accepted amount: ${cur} $${params.offerAmount.toLocaleString()}\n\n` +
    `You can now complete your purchase by visiting the link below:\n` +
    `${paymentUrl}\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p style="font-size:16px;"><b>Great news — your offer has been accepted!</b></p>` +
    `<div style="padding:14px;background:#d1fae5;border-radius:8px;margin:12px 0;">` +
    `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    `<p style="margin:4px 0;"><b>Accepted amount:</b> ${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</p>` +
    `</div>` +
    `<p>Complete your purchase now:</p>` +
    `<p><a href="${paymentUrl}" ` +
    `style="display:inline-block;padding:12px 28px;background:#16a34a;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;font-size:16px;">Proceed to Payment</a></p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}

/**
 * Offer — notify buyer that their offer was rejected
 */
export async function sendBuyerOfferRejectedEmail(params: {
  to: string;
  buyerName?: string;
  itemTitle: string;
  offerAmount: number;
  currency?: string;
  reason?: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendBuyerOfferRejectedEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.buyerName || "there";
  const cur = params.currency || "USD";
  const subject = `MyFamousFinds — Offer Update for "${params.itemTitle}"`;

  const text =
    `Hello ${name},\n\n` +
    `Unfortunately, your offer on "${params.itemTitle}" for ${cur} $${params.offerAmount.toLocaleString()} was not accepted.\n\n` +
    (params.reason ? `Seller's note: ${params.reason}\n\n` : "") +
    `You can browse more items or make a new offer on MyFamousFinds.\n` +
    `${siteUrl}\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>Unfortunately, your offer on <b>"${escapeHtml(params.itemTitle)}"</b> for ` +
    `<b>${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</b> was not accepted.</p>` +
    (params.reason ? `<p style="padding:10px;background:#fef3c7;border-radius:6px;"><b>Seller's note:</b> ${escapeHtml(params.reason)}</p>` : "") +
    `<p><a href="${siteUrl}" ` +
    `style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">Browse Items</a></p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

  await sendMail(to, subject, text, html);
}
