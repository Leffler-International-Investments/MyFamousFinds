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
const SMTP_FROM_RAW = cleanEnv(process.env.SMTP_FROM);

/**
 * Parse a "Display Name <email>" string into its parts.
 * Returns { name, email } or null if no angle-bracket email found.
 */
function parseFromAddress(raw: string): { name: string; email: string } | null {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (raw.includes("@")) return { name: "", email: raw.trim() };
  return null;
}

/**
 * Gmail SMTP requires the "from" email to match the authenticated user
 * (SMTP_USER) or a verified alias. If SMTP_FROM uses a different email,
 * we keep its display name but swap the email to SMTP_USER so Gmail
 * doesn't reject the message. The original SMTP_FROM email is set as
 * replyTo so responses still reach the intended address.
 */
const parsed = SMTP_FROM_RAW ? parseFromAddress(SMTP_FROM_RAW) : null;
const fromDisplayName = parsed?.name || "Famous Finds";
const fromEmail = parsed?.email || "";

// The actual "from" must use SMTP_USER when authenticating with Gmail
const SMTP_FROM = SMTP_USER
  ? `${fromDisplayName} <${SMTP_USER}>`
  : SMTP_FROM_RAW || "Famous Finds <no-reply@myfamousfinds.com>";

// If SMTP_FROM specified a different email than SMTP_USER, use it as replyTo
const SMTP_REPLY_TO =
  fromEmail && SMTP_USER && fromEmail.toLowerCase() !== SMTP_USER.toLowerCase()
    ? `${fromDisplayName} <${fromEmail}>`
    : undefined;

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
  const logTag = `[EMAIL] to=${to} subject="${subject}"`;
  console.log(`${logTag} — attempting to send`);
  try {
    const transport = getTransport();
    const info = await transport.sendMail({
      from: SMTP_FROM,
      ...(SMTP_REPLY_TO ? { replyTo: SMTP_REPLY_TO } : {}),
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log(`${logTag} — sent successfully (messageId=${info.messageId ?? "n/a"})`);
    return info;
  } catch (err) {
    console.error(`${logTag} — FAILED`, err);
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

  const subject = "MyFamousFinds — Your Seller Account Has Been Approved!";
  const text =
    `Hello${businessName ? " " + businessName : ""},\n\n` +
    `Great news — your seller account on MyFamousFinds has been approved!\n\n` +
    `Here's what to do next:\n\n` +
    `1. Complete your registration using the link below:\n   ${registerUrl}\n\n` +
    `2. Once registered, log in to your Seller Admin console.\n\n` +
    `3. Complete your banking details so you can receive payouts.\n\n` +
    `4. Start listing your products!\n\n` +
    `If you did not apply, you can safely ignore this email.\n\n` +
    `Welcome aboard!\n` +
    `The MyFamousFinds Team\n`;

  const html =
    `<p>Hello${businessName ? " " + escapeHtml(businessName) : ""},</p>` +
    `<p style="font-size:16px;"><b>Great news — your seller account on MyFamousFinds has been approved!</b></p>` +
    `<p>Here's what to do next:</p>` +
    `<ol style="line-height:1.8;">` +
    `<li><b>Complete your registration</b> using the link below:<br/>` +
    `<a href="${registerUrl}" style="color:#059669;">${escapeHtml(registerUrl)}</a></li>` +
    `<li>Once registered, <b>log in</b> to your Seller Admin console.</li>` +
    `<li><b>Complete your banking details</b> so you can receive payouts.</li>` +
    `<li><b>Start listing your products!</b></li>` +
    `</ol>` +
    `<p style="font-size:12px;color:#6b7280;">If you did not apply, you can safely ignore this email.</p>` +
    `<p>Welcome aboard!<br/>The MyFamousFinds Team</p>`;

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

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working. This is a test email from MyFamousFinds.\n\nIf you received this, seller emails will send on approval.";
  await sendMail(to, subject, text);
}
