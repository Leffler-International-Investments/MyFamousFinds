// FILE: /utils/email.ts
// Email transport: AWS SES (primary) with Google Workspace SMTP fallback.
// Architecture: sendMail() always tries SES first.  If SES fails (sandbox mode,
// recipient not verified, etc.) and SMTP is configured, it falls back to SMTP
// automatically.  When SES moves to production, SES will simply succeed and
// SMTP is never reached — no code changes required.
import nodemailer from "nodemailer";
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  ListIdentitiesCommand,
  DeleteIdentityCommand,
  GetSendQuotaCommand,
} from "@aws-sdk/client-ses";

function cleanEnv(v?: string) {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

/**
 * Normalise an admin/system email address so that common domain typos
 * (e.g. "@famousfinds.com" instead of "@myfamousfinds.com") are
 * auto-corrected at runtime.  A warning is logged so the env var can
 * be fixed at the source.
 */
export function normalizeAdminEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (/@famousfinds\.com$/i.test(trimmed)) {
    const fixed = trimmed.replace(/@famousfinds\.com$/i, "@myfamousfinds.com");
    console.warn(
      `[EMAIL] Auto-corrected admin email domain: "${trimmed}" → "${fixed}". ` +
        `Please update the ADMIN_EMAIL env var to use @myfamousfinds.com.`
    );
    return fixed;
  }
  return trimmed;
}

// ---------- AWS SES config ----------
const AWS_REGION = cleanEnv(process.env.AWS_REGION) || "us-east-1";
const AWS_ACCESS_KEY_ID = cleanEnv(process.env.AWS_ACCESS_KEY_ID);
const AWS_SECRET_ACCESS_KEY = cleanEnv(process.env.AWS_SECRET_ACCESS_KEY);

// Transport preference:
// - "auto" (default): try SES first, fallback to SMTP on failure
// - "smtp": SMTP only — bypass SES entirely (use while SES is in Sandbox)
// - "ses": SES only (no fallback)
const EMAIL_TRANSPORT = (cleanEnv(process.env.EMAIL_TRANSPORT) || "auto").toLowerCase();
// SES sender must be a verified identity in AWS — NEVER fall back to SMTP_FROM
// (which is typically a personal Gmail and will be rejected by SES).
const AWS_SES_FROM =
  cleanEnv(process.env.AWS_SES_FROM) ||
  "Famous Finds <admin@myfamousfinds.com>";
// IMPORTANT: The Reply-To address MUST point to an inbox that can actually
// receive mail.  admin@myfamousfinds.com only works once:
//   1. Root-domain MX records are added (see config/aws-ses-dns-records.json), AND
//   2. An inbox / alias / SES inbound rule exists for that address.
// Until then, set SUPPORT_INBOX to an address that works (e.g. your Gmail).
const AWS_SES_REPLY_TO =
  cleanEnv(process.env.AWS_SES_REPLY_TO) ||
  cleanEnv(process.env.SUPPORT_INBOX) ||
  "Famous Finds Support <admin@myfamousfinds.com>";

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

// ---------- SMTP (Google Workspace fallback — admin@myfamousfinds.com) ----------
const SMTP_HOST = cleanEnv(process.env.SMTP_HOST);
const SMTP_PORT = Number(cleanEnv(process.env.SMTP_PORT) || "587");
const SMTP_USER = cleanEnv(process.env.SMTP_USER) || cleanEnv(process.env.SMTP_USER_ADMIN);
const SMTP_PASS = cleanEnv(process.env.SMTP_PASS) || cleanEnv(process.env.SMTP_PASS_ADMIN);
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

const SMTP_REPLY_TO =
  cleanEnv(process.env.SUPPORT_INBOX) ||
  "Famous Finds Support <admin@myfamousfinds.com>";

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

// ---------- Startup diagnostics (logged once on cold start) ----------
console.log(
  `[EMAIL CONFIG] transport=${EMAIL_TRANSPORT}` +
  ` | SES: ${isSesConfigured() ? "YES" : "NO"} (region=${AWS_REGION || "not set"})` +
  ` | SMTP: ${Boolean(SMTP_HOST && SMTP_USER) ? "YES" : "NO"}` +
  ` (host=${SMTP_HOST || "not set"}, user=${SMTP_USER || "not set"}, pass=${SMTP_PASS ? "set" : "NOT SET"})`
);

// ---------- Shared helpers ----------

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Send email via AWS SES.
 * When attachments are provided, uses SendRawEmailCommand with nodemailer-compiled MIME.
 */
async function sendViaSes(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: EmailAttachment[]
) {
  const parsedFrom = parseFromAddress(AWS_SES_FROM);
  const sourceEmail = parsedFrom?.email || AWS_SES_FROM;
  const source = parsedFrom?.name
    ? `${parsedFrom.name} <${sourceEmail}>`
    : sourceEmail;

  console.log(`[SES] Sending from="${source}" to="${to}" subject="${subject}"${attachments?.length ? ` (${attachments.length} attachments)` : ""}`);

  const client = getSesClient();

  try {
    // If attachments are present, use raw email (MIME) so SES can deliver them
    if (attachments?.length) {
      const transporter = nodemailer.createTransport({ streamTransport: true } as any);
      const mailMessage = await transporter.sendMail({
        from: source,
        replyTo: AWS_SES_REPLY_TO,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
        attachments,
      });
      // mailMessage.message is a readable stream — collect it into a Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of mailMessage.message) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const rawData = Buffer.concat(chunks);

      const result = await client.send(
        new SendRawEmailCommand({
          Source: sourceEmail,
          Destinations: [to],
          RawMessage: { Data: rawData },
        })
      );
      return { messageId: result.MessageId || "n/a" };
    }

    // No attachments — use simple SendEmailCommand
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
    const result = await client.send(command);
    return { messageId: result.MessageId || "n/a" };
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("not verified") || msg.includes("identity")) {
      const recipientInError = msg.includes(to);
      if (recipientInError) {
        console.error(
          `[SES] RECIPIENT NOT VERIFIED — "${to}" is not verified in AWS SES (region: ${AWS_REGION}).`,
          `\nSES is likely in sandbox mode. In sandbox, BOTH sender and recipient must be verified.`,
          `\nFix: Set EMAIL_TRANSPORT=smtp to bypass SES, or request SES production access.`
        );
      } else {
        console.error(
          `[SES] SENDER NOT VERIFIED — "${sourceEmail}" is not verified in AWS SES (region: ${AWS_REGION}).`,
          `\nFix: In Vercel, set AWS_SES_FROM to a verified SES identity.`
        );
      }
    }
    throw err;
  }
}

/** Attachment type for sendMail / sendViaSmtp / sendViaSes. */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string; // Buffer or base64 string
  contentType?: string;     // e.g. "image/gif"
  cid?: string;             // Content-ID for inline <img src="cid:xxx">
  encoding?: string;        // "base64" if content is a base64 string
}

/**
 * Send email via SMTP (Google Workspace fallback).
 */
async function sendViaSmtp(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: EmailAttachment[]
) {
  const transport = getSmtpTransport();
  const info = await transport.sendMail({
    from: SMTP_FROM,
    ...(SMTP_REPLY_TO ? { replyTo: SMTP_REPLY_TO } : {}),
    to,
    subject,
    text,
    ...(html ? { html } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
  return { messageId: info.messageId ?? "n/a" };
}

/**
 * Main sendMail — uses AWS SES when configured, with SMTP fallback.
 *
 * Flow:
 *   1. If SES configured → try SES
 *   2. If SES fails (sandbox, unverified recipient, etc.) AND SMTP configured
 *      → automatically fall back to Google Workspace SMTP
 *   3. When SES is promoted to production mode, step 1 succeeds and SMTP
 *      is never reached — zero code changes required.
 */

function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER);
}

/** Returns true when the SES error is a sandbox-mode restriction. */
function isSandboxError(err: any): boolean {
  const msg = String(err?.message || "");
  return (
    msg.includes("not verified") ||
    msg.includes("Email address is not verified") ||
    msg.includes("identity") ||
    msg.includes("MessageRejected")
  );
}

// Support both positional args AND object args (for UPS label route)
type SendMailArgsObject = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
};

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ messageId: string }>;
export async function sendMail(
  args: SendMailArgsObject
): Promise<{ messageId: string }>;
export async function sendMail(
  a: string | SendMailArgsObject,
  b?: string,
  c?: string,
  d?: string
) {
  const to = typeof a === "string" ? a : a.to;
  const subject = typeof a === "string" ? (b || "") : a.subject;
  const text = typeof a === "string" ? (c || "") : a.text;
  const html = typeof a === "string" ? d : a.html;
  const attachments = typeof a === "object" ? a.attachments : undefined;

  const logTag = `[EMAIL] to=${to} subject="${subject}"`;
  console.log(`${logTag} — attempting to send (transport=${EMAIL_TRANSPORT})`);

  // ── EMAIL_TRANSPORT=smtp → bypass SES entirely, send via Google Workspace ──
  // Use this while SES is in Sandbox mode to avoid SES failures entirely.
  if (EMAIL_TRANSPORT === "smtp") {
    if (!isSmtpConfigured()) {
      throw new Error(
        "EMAIL_TRANSPORT=smtp but SMTP is not configured. " +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASS in Vercel env vars."
      );
    }
    try {
      const result = await sendViaSmtp(to, subject, text, html, attachments);
      console.log(`${logTag} — sent via SMTP / admin@myfamousfinds.com (transport=smtp, messageId=${result.messageId})`);
      return result;
    } catch (err: any) {
      console.error(`${logTag} — SMTP (admin@myfamousfinds.com) FAILED`, err);
      throw new Error(
        `SMTP failed (transport=smtp): ${err?.message || "unknown"}. ` +
        `Config: host=${SMTP_HOST || "(not set)"} user=${SMTP_USER || "(not set)"} port=${SMTP_PORT}`
      );
    }
  }

  // ── SES path (transport=ses or transport=auto) ──
  // When SES goes live (production mode), emails succeed here and SMTP is never touched.
  if (isSesConfigured()) {
    try {
      const result = await sendViaSes(to, subject, text, html, attachments);
      console.log(`${logTag} — sent via AWS SES (messageId=${result.messageId})`);
      return result;
    } catch (sesErr: any) {
      // If transport=ses, do NOT fall back — throw immediately
      if (EMAIL_TRANSPORT === "ses") {
        console.error(`${logTag} — AWS SES FAILED (transport=ses, no fallback)`, sesErr);
        throw sesErr;
      }

      // transport=auto — fall back to SMTP (Google Workspace)
      const sandbox = isSandboxError(sesErr);
      if (sandbox) {
        console.warn(
          `${logTag} — SES SANDBOX restriction (recipient "${to}" not verified). ` +
          `Falling back to Google Workspace SMTP (admin@myfamousfinds.com). ` +
          `TIP: Set EMAIL_TRANSPORT=smtp in Vercel to skip SES entirely while in sandbox.`
        );
      } else {
        console.error(`${logTag} — AWS SES FAILED, trying SMTP fallback`, sesErr);
      }

      if (isSmtpConfigured()) {
        try {
          const result = await sendViaSmtp(to, subject, text, html, attachments);
          console.log(
            `${logTag} — sent via SMTP fallback / admin@myfamousfinds.com (messageId=${result.messageId})` +
            (sandbox ? ` [SES sandbox → SMTP auto-fallback]` : ``)
          );
          return result;
        } catch (smtpErr: any) {
          const smtpMsg = smtpErr?.message || "Unknown SMTP error";
          console.error(`${logTag} — SMTP fallback (admin@myfamousfinds.com) also FAILED: ${smtpMsg}`, smtpErr);
          // Throw a combined error so the caller sees BOTH failures
          const combined = new Error(
            `Email delivery failed via both transports.\n` +
            `  SES error: ${sesErr?.message || "unknown"}\n` +
            `  SMTP error (admin@myfamousfinds.com): ${smtpMsg}\n` +
            `  SMTP config: host=${SMTP_HOST || "(not set)"} user=${SMTP_USER || "(not set)"} port=${SMTP_PORT}`
          );
          (combined as any).sesError = sesErr;
          (combined as any).smtpError = smtpErr;
          throw combined;
        }
      }

      // SMTP not configured — throw SES error with guidance
      throw new Error(
        `SES failed: ${sesErr?.message || "unknown"}. ` +
        `SMTP fallback NOT configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in Vercel, ` +
        `or set EMAIL_TRANSPORT=smtp to bypass SES entirely.`
      );
    }
  }

  // SES not configured — use SMTP directly (Google Workspace)
  if (isSmtpConfigured()) {
    console.warn(`${logTag} — AWS SES not configured, using Google Workspace SMTP (admin@myfamousfinds.com)`);
    try {
      const result = await sendViaSmtp(to, subject, text, html, attachments);
      console.log(`${logTag} — sent via SMTP / admin@myfamousfinds.com (messageId=${result.messageId})`);
      return result;
    } catch (err) {
      console.error(`${logTag} — SMTP (admin@myfamousfinds.com) FAILED`, err);
      throw err;
    }
  }

  throw new Error(
    "No email transport configured. Set AWS SES credentials or SMTP_HOST/SMTP_USER, " +
    "or set EMAIL_TRANSPORT=smtp with SMTP credentials."
  );
}

// ---------- SES Identity Verification (sandbox mode support) ----------

/**
 * Check whether SES is in sandbox mode by inspecting the send quota.
 * In sandbox mode, the max 24-hour send is typically 200.
 */
export async function isSesInSandbox(): Promise<boolean> {
  if (!isSesConfigured()) return false;
  try {
    const client = getSesClient();
    const result = await client.send(new GetSendQuotaCommand({}));
    // Sandbox accounts have a max24HourSend of 200
    return (result.Max24HourSend ?? 0) <= 200;
  } catch {
    return false;
  }
}

/**
 * Send a verification email to an address so it can receive mail in SES sandbox mode.
 * The recipient will get an email with a confirmation link they must click.
 */
export async function verifySesEmailIdentity(email: string): Promise<void> {
  if (!isSesConfigured()) {
    throw new Error("AWS SES is not configured (missing credentials).");
  }
  const client = getSesClient();
  await client.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
  console.log(`[SES] Verification email sent to ${email}`);
}

/**
 * Check the verification status of one or more email identities in SES.
 * Returns a map of email → status ("Pending" | "Success" | "Failed" | "TemporaryFailure" | "NotStarted").
 */
export async function checkSesIdentityStatus(
  emails: string[]
): Promise<Record<string, string>> {
  if (!isSesConfigured()) return {};
  const client = getSesClient();
  const result = await client.send(
    new GetIdentityVerificationAttributesCommand({ Identities: emails })
  );
  const statuses: Record<string, string> = {};
  for (const email of emails) {
    const attr = result.VerificationAttributes?.[email];
    statuses[email] = attr?.VerificationStatus ?? "NotStarted";
  }
  return statuses;
}

/**
 * List all verified email identities in SES.
 */
export async function listVerifiedSesIdentities(): Promise<string[]> {
  if (!isSesConfigured()) return [];
  const client = getSesClient();
  const result = await client.send(
    new ListIdentitiesCommand({ IdentityType: "EmailAddress", MaxItems: 100 })
  );
  const identities = result.Identities || [];
  if (identities.length === 0) return [];

  // Filter to only those with "Success" status
  const statusResult = await client.send(
    new GetIdentityVerificationAttributesCommand({ Identities: identities })
  );
  return identities.filter((id) => {
    const attr = statusResult.VerificationAttributes?.[id];
    return attr?.VerificationStatus === "Success";
  });
}

/**
 * Delete (remove) an email identity from SES.
 */
export async function deleteSesEmailIdentity(email: string): Promise<void> {
  if (!isSesConfigured()) {
    throw new Error("AWS SES is not configured (missing credentials).");
  }
  const client = getSesClient();
  await client.send(new DeleteIdentityCommand({ Identity: email }));
  console.log(`[SES] Identity removed: ${email}`);
}

/**
 * Check if a recipient email is verified in SES. Useful to pre-check before
 * sending in sandbox mode.
 */
export async function isSesRecipientVerified(email: string): Promise<boolean> {
  const statuses = await checkSesIdentityStatus([email]);
  return statuses[email] === "Success";
}

/**
 * 2FA / Login Code email (used by /pages/api/auth/start-2fa.ts)
 */
export async function sendLoginCode(to: string, code: string) {
  const email = String(to || "").trim();
  const c = String(code || "").trim();

  if (!email) throw new Error("sendLoginCode missing required field: to");
  if (!c) throw new Error("sendLoginCode missing required field: code");

  const subject = "Famous Finds — Your Login Code";
  const text =
    "Hello,\n\n" +
    "Use the login code below to sign in:\n\n" +
    `${c}\n\n` +
    "If you did not request this, you can ignore this email.\n\n" +
    "Famous Finds";

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Your Login Code</p>` +
    `<p style="margin:0 0 12px 0;">Use the login code below to sign in:</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr><td style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:16px 28px;">` +
    `<span style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#1c1917;">${escapeHtml(c)}</span>` +
    `</td></tr></table>` +
    `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">If you did not request this, you can ignore this email.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

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
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
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
  const addrParts = [d.address, d.city, d.state, d.zip, d.country].filter(Boolean);
  if (addrParts.length) summaryLines.push(`  Address: ${addrParts.join(", ")}`);
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
  const addrHtmlParts = [d.address, d.city, d.state, d.zip, d.country].filter(Boolean);
  if (addrHtmlParts.length)
    summaryRows.push(`<tr><td style="padding:4px 8px;color:#6b7280;">Address</td><td style="padding:4px 8px;">${escapeHtml(addrHtmlParts.join(", "))}</td></tr>`);
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

  const subject = "Famous Finds — Application Received";
  const text =
    `${greeting.replace(/<[^>]*>/g, "")},\n\n` +
    "Thank you for applying to become a seller on Famous Finds!\n\n" +
    "We have received your application with the following details:\n\n" +
    summaryText + "\n\n" +
    "Your application is under review. You will be notified once vetted.\n\n" +
    "If you have any questions in the meantime, feel free to reply to this email.\n\n" +
    "Regards,\n" +
    "The Famous Finds Team";

  // Build branded summary table matching the order confirmation style
  const brandedSummaryRows: string[] = [];
  if (d.businessName)
    brandedSummaryRows.push(`<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:130px;">Business Name</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(d.businessName)}</td></tr>`);
  if (d.contactName)
    brandedSummaryRows.push(`<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Contact Name</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(d.contactName)}</td></tr>`);
  brandedSummaryRows.push(`<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Email</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(email)}</td></tr>`);
  if (d.phone)
    brandedSummaryRows.push(`<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(d.phone)}</td></tr>`);
  const addrBrandedParts = [d.address, d.city, d.state, d.zip, d.country].filter(Boolean);
  if (addrBrandedParts.length)
    brandedSummaryRows.push(`<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Address</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(addrBrandedParts.join(", "))}</td></tr>`);

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">${greeting},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Thank You for Your Application!</p>` +
    `<p style="margin:0 0 12px 0;">Thank you for applying to become a seller on <b>Famous Finds</b>!</p>` +
    `<p style="margin:0 0 8px 0;">We have received your application with the following details:</p>` +
    // Application details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">APPLICATION DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    brandedSummaryRows.join("") +
    `</table></td></tr></table>` +
    // Status notice
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">` +
    `<tr><td style="padding:12px 16px;background-color:#fafaf9;border-left:4px solid #d4a843;border-radius:4px;font-size:14px;">` +
    `<b>Your application is under review.</b> You will be notified once vetted.</td></tr></table>` +
    `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">If you have any questions in the meantime, feel free to reply to this email.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

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

  const cur = params.currency || "USD";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Thank You for Your Purchase!</p>` +
    // Order details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">ORDER DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Total</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${escapeHtml(params.amount)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Order ID</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.orderId)}</td></tr>` +
    `</table></td></tr></table>` +
    // CTA
    `<p style="margin:0 0 20px 0;">We will process your order and keep you updated on shipping.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}/my-orders" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW YOUR ORDER</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

  await sendMail(to, subject, text, html);
}

// ────────────────────────────────────────────────
// Branded email wrapper — Famous Finds style
// ────────────────────────────────────────────────

export function brandedEmailWrapper(bodyHtml: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const logoUrl = `${siteUrl}/Famous-Finds-Logo-2.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<!-- Header -->
<tr><td style="background-color:#1c1917;padding:28px 32px;text-align:center;">
  <img src="${escapeHtml(logoUrl)}" alt="Famous Finds" width="180" style="display:inline-block;max-width:180px;height:auto;" />
</td></tr>
<!-- Gold accent bar -->
<tr><td style="height:4px;background:linear-gradient(90deg,#b8860b,#d4a843,#b8860b);font-size:0;line-height:0;">&nbsp;</td></tr>
<!-- Body -->
<tr><td style="padding:32px 32px 24px 32px;color:#1c1917;font-size:15px;line-height:1.6;">
${bodyHtml}
</td></tr>
<!-- Footer -->
<tr><td style="background-color:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;text-align:center;">
  <p style="margin:0 0 4px 0;font-size:13px;color:#78716c;">Authenticated Luxury Resale</p>
  <p style="margin:0;font-size:12px;color:#a8a29e;">
    <a href="${escapeHtml(siteUrl)}" style="color:#b8860b;text-decoration:none;">myfamousfinds.com</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Seller — item sold notification email (basic, without label)
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
  const cur = params.currency || "USD";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const subject = "Famous Finds — Your Item Has Been Sold!";

  const text =
    `Hello ${name},\n\n` +
    `Congratulations — your item has been sold on Famous Finds!\n\n` +
    `Item: ${params.itemTitle}\n` +
    `Sale Amount: ${cur} ${params.amount}\n` +
    `Order ID: ${params.orderId}\n\n` +
    `Please prepare the item for shipping. You can view the order details ` +
    `in your Seller Dashboard: ${siteUrl}/seller/orders\n\n` +
    `Regards,\nThe Famous Finds Team\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Congratulations — Your Item Has Been Sold!</p>` +
    // Order details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">ORDER DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Sale Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${escapeHtml(params.amount)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Order ID</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.orderId)}</td></tr>` +
    `</table></td></tr></table>` +
    // CTA
    `<p style="margin:0 0 20px 0;">Please prepare the item for shipping. Your UPS shipping label will be emailed to you shortly.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}/seller/orders" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW ORDER DETAILS</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for selling with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail(to, subject, text, html);
}

/**
 * Seller — combined sale confirmation + UPS shipping label email (branded)
 * Sent when a UPS label has been auto-generated after payment.
 */
export async function sendSellerLabelActionRequiredEmail(params: {
  to: string;
  sellerName?: string;
  orderId: string;
  itemTitle: string;
  reason: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendSellerLabelActionRequiredEmail missing required field: to");

  const name = params.sellerName || "Seller";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const subject = "Famous Finds — Action Required to Generate Your UPS Label";

  const text =
    `Hello ${name},\n\n` +
    `Good news — your item has been sold on Famous Finds.\n\n` +
    `Order ID: ${params.orderId}\n` +
    `Item: ${params.itemTitle}\n\n` +
    `We could not generate the UPS shipping label automatically because: ${params.reason}\n\n` +
    `Next step (takes 1 minute):\n` +
    `1) Log in to your Seller Dashboard\n` +
    `2) Go to Banking / Shipping Details: ${siteUrl}/seller/banking\n` +
    `3) Add/confirm your full shipping address (street, city, state, zip)\n\n` +
    `Once your address is saved, the system will generate the UPS label for this order.\n\n` +
    `Regards,\nThe Famous Finds Team\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Action Required to Generate Your UPS Label</p>` +
    `<p style="margin:0 0 12px 0;"><b>Great news:</b> your item has been sold on Famous Finds.</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;">` +
    `<p style="margin:0 0 6px 0;font-size:15px;"><b>Order ID:</b> ${escapeHtml(params.orderId)}</p>` +
    `<p style="margin:0 0 6px 0;font-size:15px;"><b>Item:</b> ${escapeHtml(params.itemTitle)}</p>` +
    `<p style="margin:0;font-size:15px;"><b>Reason:</b> ${escapeHtml(params.reason)}</p>` +
    `</td></tr></table>` +
    `<p style="margin:0 0 8px 0;font-weight:bold;">Next step (takes 1 minute):</p>` +
    `<ol style="margin:0 0 20px 0;padding-left:18px;line-height:1.8;">` +
    `<li>Log in to your Seller Dashboard</li>` +
    `<li>Open <a href="${escapeHtml(siteUrl)}/seller/banking" style="color:#b8860b;text-decoration:none;">Banking / Shipping Details</a></li>` +
    `<li>Add/confirm your full shipping address (street, city, state, zip)</li>` +
    `</ol>` +
    `<p style="margin:0 0 12px 0;">Once your address is saved, the system will generate the UPS label for this order.</p>` +
    `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">If you have questions, reply to this email.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

  await sendMail({ to, subject, text, html });
}

export async function sendSellerSoldWithLabelEmail(params: {
  to: string;
  sellerName?: string;
  itemTitle: string;
  amount: string;
  currency?: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl?: string;
  labelBase64?: string;
  labelFormat?: string;
  buyerName?: string;
  buyerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendSellerSoldWithLabelEmail missing required field: to");

  const name = params.sellerName || "Seller";
  const cur = params.currency || "USD";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const subject = "Famous Finds — Sale Confirmed & Shipping Label Ready";

  // Build buyer address string for plain text
  const ba = params.buyerAddress;
  const buyerAddrLines: string[] = [];
  if (params.buyerName) buyerAddrLines.push(params.buyerName);
  if (ba) {
    buyerAddrLines.push(ba.line1);
    if (ba.line2) buyerAddrLines.push(ba.line2);
    buyerAddrLines.push(`${ba.city}, ${ba.state} ${ba.postal_code}`);
    if (ba.country && ba.country !== "US") buyerAddrLines.push(ba.country);
  }

  const text =
    `Hello ${name},\n\n` +
    `Congratulations — your item has been sold on Famous Finds!\n\n` +
    `SALE DETAILS\n` +
    `Item: ${params.itemTitle}\n` +
    `Sale Amount: ${cur} ${params.amount}\n` +
    `Order ID: ${params.orderId}\n\n` +
    `SHIPPING LABEL\n` +
    `A UPS shipping label has been generated and is ready to print.\n` +
    `Tracking Number: ${params.trackingNumber}\n` +
    `Track: ${params.trackingUrl}\n` +
    (params.labelUrl ? `Download Label: ${params.labelUrl}\n` : "") + `\n` +
    (buyerAddrLines.length
      ? `SHIP TO\n${buyerAddrLines.join("\n")}\n\n`
      : "") +
    `Print the label, attach it to your package, and drop it off at any UPS location.\n\n` +
    `Regards,\nThe Famous Finds Team\n`;

  // Buyer address HTML block
  let buyerAddressHtml = "";
  if (ba) {
    buyerAddressHtml =
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
      `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
      `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">SHIP TO</p></td></tr>` +
      `<tr><td style="padding:16px 20px;">` +
      (params.buyerName ? `<p style="margin:0 0 4px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.buyerName)}</p>` : "") +
      `<p style="margin:0;font-size:14px;color:#44403c;line-height:1.5;">${escapeHtml(ba.line1)}` +
      (ba.line2 ? `<br/>${escapeHtml(ba.line2)}` : "") +
      `<br/>${escapeHtml(ba.city)}, ${escapeHtml(ba.state)} ${escapeHtml(ba.postal_code)}` +
      (ba.country && ba.country !== "US" ? `<br/>${escapeHtml(ba.country)}` : "") +
      `</p></td></tr></table>`;
  }

  // Build label image for email — use CID attachment (works in Gmail/Outlook)
  // instead of data: URI (which Gmail blocks).
  let inlineLabelHtml = "";
  const labelAttachments: EmailAttachment[] = [];
  const labelCid = "ups-shipping-label";

  if (params.labelBase64 && params.labelFormat) {
    const fmt = params.labelFormat.toUpperCase();
    if (fmt === "GIF" || fmt === "PNG") {
      const mimeType = fmt === "GIF" ? "image/gif" : "image/png";
      const ext = fmt.toLowerCase();
      const labelBuffer = Buffer.from(params.labelBase64, "base64");
      // Inline CID attachment — renders the label image inside the email body
      labelAttachments.push({
        filename: `shipping-label-${params.orderId}.${ext}`,
        content: labelBuffer,
        contentType: mimeType,
        cid: labelCid,
      });
      // Regular downloadable attachment — appears in the email attachment tray
      // so the seller can download/save/print the label file directly
      labelAttachments.push({
        filename: `shipping-label-${params.orderId}.${ext}`,
        content: labelBuffer,
        contentType: mimeType,
      });
      inlineLabelHtml =
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">` +
        `<tr><td align="center" style="padding:16px;background:#ffffff;border:1px solid #e7e5e4;border-radius:8px;">` +
        `<img src="cid:${labelCid}" alt="UPS Shipping Label" style="max-width:100%;width:400px;height:auto;display:block;" />` +
        `</td></tr></table>`;
    }
  } else if (params.labelUrl) {
    // No base64 available — use the Firebase Storage URL as remote image
    inlineLabelHtml =
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">` +
      `<tr><td align="center" style="padding:16px;background:#ffffff;border:1px solid #e7e5e4;border-radius:8px;">` +
      `<img src="${escapeHtml(params.labelUrl)}" alt="UPS Shipping Label" style="max-width:100%;width:400px;height:auto;display:block;" />` +
      `</td></tr></table>`;
  }

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Congratulations — Your Item Has Been Sold!</p>` +
    // Order details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">SALE DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Sale Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${escapeHtml(params.amount)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Order ID</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.orderId)}</td></tr>` +
    `</table></td></tr></table>` +
    // Buyer address
    buyerAddressHtml +
    // Shipping label section
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">UPS SHIPPING LABEL</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Tracking #</td>` +
    `<td style="padding:6px 0;font-size:14px;color:#1c1917;"><a href="${escapeHtml(params.trackingUrl)}" style="color:#b8860b;text-decoration:none;font-weight:bold;">${escapeHtml(params.trackingNumber)}</a></td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Service</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">UPS Ground</td></tr>` +
    `</table></td></tr></table>` +
    // Inline label image
    inlineLabelHtml +
    // Download & Print buttons — always prominently visible, link to universal viewer page
    (() => {
      const viewerBase = `${siteUrl}/label/view`;
      const viewerLink = params.labelUrl
        ? `${viewerBase}?url=${encodeURIComponent(params.labelUrl)}&order=${encodeURIComponent(params.orderId)}`
        : "";
      const rawLink = params.labelUrl ? escapeHtml(params.labelUrl) : "";

      if (params.labelUrl) {
        return (
          // Prominent action banner
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background-color:#fef9ee;border:1px solid #f5e6c8;border-radius:8px;">` +
          `<tr><td style="padding:16px 20px 8px 20px;">` +
          `<p style="margin:0;font-size:15px;font-weight:bold;color:#92400e;text-align:center;">&#x1F4E6; Your label is ready — download or print it below` +
          (labelAttachments.length ? `, or open the attachment` : ``) + `</p>` +
          `</td></tr>` +
          `<tr><td align="center" style="padding:8px 20px 16px 20px;">` +
          `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
          // Download button — links to viewer page for universal iOS/Android support
          `<td style="border-radius:8px;background-color:#b8860b;padding:0;">` +
          `<a href="${escapeHtml(viewerLink)}" style="display:inline-block;padding:18px 40px;color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;letter-spacing:0.5px;" target="_blank">` +
          `&#x2B07;&#xFE0F; DOWNLOAD LABEL</a>` +
          `</td>` +
          `<td style="width:14px;"></td>` +
          // Print button — links to same viewer page which handles print
          `<td style="border-radius:8px;background-color:#1c1917;padding:0;">` +
          `<a href="${escapeHtml(viewerLink)}" style="display:inline-block;padding:18px 40px;color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;letter-spacing:0.5px;" target="_blank">` +
          `&#x1F5A8;&#xFE0F; PRINT LABEL</a>` +
          `</td>` +
          `</tr></table>` +
          `</td></tr>` +
          `<tr><td align="center" style="padding:0 20px 14px 20px;">` +
          `<p style="margin:0;font-size:12px;color:#78716c;">Works on iPhone, iPad, Android &amp; desktop. Tap a button to open the label viewer.</p>` +
          `</td></tr>` +
          // Fallback: plain direct link in case buttons don't render
          `<tr><td align="center" style="padding:0 20px 14px 20px;">` +
          `<p style="margin:0;font-size:12px;color:#a8a29e;">Can't see the buttons? <a href="${rawLink}" style="color:#b8860b;text-decoration:underline;" target="_blank">Open label directly</a>` +
          (labelAttachments.length ? ` or check the attachment on this email` : ``) + `</p>` +
          `</td></tr>` +
          `</table>`
        );
      }
      if (labelAttachments.length) {
        return (
          `<p style="margin:0 0 16px 0;font-size:14px;color:#1c1917;background:#fef9ee;border:1px solid #f5e6c8;border-radius:8px;padding:12px 16px;">` +
          `&#x1F4CE; The shipping label is attached to this email. Open the attachment to download and print.</p>`
        );
      }
      return "";
    })() +
    // Instructions
    `<div style="background-color:#fef9ee;border:1px solid #f5e6c8;border-radius:8px;padding:16px 20px;margin:0 0 20px 0;">` +
    `<p style="margin:0 0 8px 0;font-size:14px;font-weight:bold;color:#92400e;">Next Steps:</p>` +
    `<ol style="margin:0;padding-left:20px;color:#78716c;font-size:13px;line-height:1.8;">` +
    `<li>Download and print the shipping label${params.labelUrl && labelAttachments.length ? " (click the button above or open the attachment)" : params.labelUrl ? " (click the button above)" : " (see attachment)"}</li>` +
    `<li>Package the item securely</li>` +
    `<li>Attach the label to your package</li>` +
    `<li>Drop off at any UPS location or schedule a pickup</li>` +
    `</ol></div>` +
    // Dashboard link
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}/seller/orders" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW ORDER IN DASHBOARD</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for selling with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail({ to, subject, text, html, attachments: labelAttachments.length ? labelAttachments : undefined });
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

/**
 * Proof Request — notify seller that proof of purchase/authenticity is needed
 */
export async function sendProofRequestEmail(params: {
  to: string;
  sellerName?: string;
  itemTitle: string;
  listingId: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendProofRequestEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.sellerName || "Seller";
  const subject = `MyFamousFinds — Proof of Purchase Requested for "${params.itemTitle}"`;

  const text =
    `Hello ${name},\n\n` +
    `Our review team has requested proof of purchase or authenticity documentation ` +
    `for your listing:\n\n` +
    `Item: ${params.itemTitle}\n\n` +
    `Please upload a receipt, invoice, certificate of authenticity, or other proof ` +
    `of purchase in your Seller Catalogue:\n` +
    `${siteUrl}/seller/catalogue\n\n` +
    `Until proof is provided, your listing will remain on hold.\n\n` +
    `If you have any questions, feel free to reply to this email.\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const html =
    `<p>Hello ${escapeHtml(name)},</p>` +
    `<p>Our review team has requested <b>proof of purchase or authenticity documentation</b> ` +
    `for your listing:</p>` +
    `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
    `<p style="margin:4px 0;font-size:16px;"><b>${escapeHtml(params.itemTitle)}</b></p>` +
    `</div>` +
    `<p>Please upload a receipt, invoice, certificate of authenticity, or other proof ` +
    `of purchase in your Seller Catalogue.</p>` +
    `<p><a href="${siteUrl}/seller/catalogue" ` +
    `style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#000;` +
    `border-radius:999px;text-decoration:none;font-weight:600;">Upload Proof</a></p>` +
    `<p style="font-size:13px;color:#6b7280;">Until proof is provided, your listing will remain on hold.</p>` +
    `<p>If you have any questions, feel free to reply to this email.</p>` +
    `<p>Regards,<br/>The MyFamousFinds Team</p>`;

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

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">You Have Received a New Offer!</p>` +
    // Offer details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">OFFER DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    (params.listingPrice ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Listing Price</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.listingPrice.toLocaleString()}</td></tr>` : "") +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Offer Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Buyer</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.buyerEmail)}</td></tr>` +
    (params.message ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Message</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.message)}</td></tr>` : "") +
    `</table></td></tr></table>` +
    // CTA
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}/seller/offers" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW OFFERS</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for selling with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
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

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Your Offer Was Accepted!</p>` +
    // Offer details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">OFFER ACCEPTED</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Accepted Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</td></tr>` +
    `</table></td></tr></table>` +
    // CTA
    `<p style="margin:0 0 20px 0;">Complete your purchase now:</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">PROCEED TO PAYMENT</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail(to, subject, text, html);
}

/**
 * Offer — notify buyer that their offer was rejected
 */
/**
 * Buyer — shipping notification with tracking info (sent when UPS label is generated)
 */
export async function sendBuyerShippingNotificationEmail(params: {
  to: string;
  buyerName?: string;
  orderId: string;
  itemTitle: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier?: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendBuyerShippingNotificationEmail missing required field: to");

  const name = params.buyerName || "there";
  const carrier = params.carrier || "UPS";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const subject = "Famous Finds — Your Order Is Being Shipped!";

  const text =
    `Hello ${name},\n\n` +
    `Great news — your order is on its way!\n\n` +
    `Item: ${params.itemTitle}\n` +
    `Order ID: ${params.orderId}\n` +
    `Carrier: ${carrier}\n` +
    `Tracking Number: ${params.trackingNumber}\n` +
    `Track your package: ${params.trackingUrl}\n\n` +
    `You can also view your order status anytime at:\n` +
    `${siteUrl}/account\n\n` +
    `Thank you for shopping with Famous Finds!\n\n` +
    `Regards,\nThe Famous Finds Team\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Your Order Is Being Shipped!</p>` +
    // Shipping details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">SHIPPING DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Order ID</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.orderId)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Carrier</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(carrier)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Tracking #</td>` +
    `<td style="padding:6px 0;font-size:14px;color:#1c1917;"><a href="${escapeHtml(params.trackingUrl)}" style="color:#b8860b;text-decoration:none;font-weight:bold;">${escapeHtml(params.trackingNumber)}</a></td></tr>` +
    `</table></td></tr></table>` +
    // Track button
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">` +
    `<tr><td align="center">` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#b8860b;">` +
    `<a href="${escapeHtml(params.trackingUrl)}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:0.5px;">TRACK YOUR PACKAGE</a>` +
    `</td></tr></table>` +
    `</td></tr></table>` +
    // View order link
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}/account" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW YOUR ORDER</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail(to, subject, text, html);
}

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

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Offer Update</p>` +
    // Offer details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">OFFER DETAILS</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Offer Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.offerAmount.toLocaleString()}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Status</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">Not Accepted</td></tr>` +
    (params.reason ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Seller's Note</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(params.reason)}</td></tr>` : "") +
    `</table></td></tr></table>` +
    // CTA
    `<p style="margin:0 0 20px 0;">You can browse more items or make a new offer on MyFamousFinds.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">BROWSE ITEMS</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail(to, subject, text, html);
}

/**
 * Offer — notify buyer of a counter offer from the seller
 */
export async function sendBuyerCounterOfferEmail(params: {
  to: string;
  buyerName?: string;
  itemTitle: string;
  originalAmount: number;
  counterAmount: number;
  currency?: string;
  listingId?: string;
}) {
  const to = (params.to || "").trim();
  if (!to) throw new Error("sendBuyerCounterOfferEmail missing required field: to");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const name = params.buyerName || "there";
  const cur = params.currency || "USD";
  const itemUrl = params.listingId ? `${siteUrl}/product/${params.listingId}` : siteUrl;
  const subject = `MyFamousFinds — Counter Offer on "${params.itemTitle}"`;

  const text =
    `Hello ${name},\n\n` +
    `The seller has responded to your offer on "${params.itemTitle}".\n\n` +
    `Your offer: ${cur} $${params.originalAmount.toLocaleString()}\n` +
    `Counter offer: ${cur} $${params.counterAmount.toLocaleString()}\n\n` +
    `View the item and respond:\n${itemUrl}\n\n` +
    `Regards,\nThe MyFamousFinds Team\n`;

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">You Received a Counter Offer!</p>` +
    // Counter offer details card
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
    `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
    `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">COUNTER OFFER</p></td></tr>` +
    `<tr><td style="padding:16px 20px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(params.itemTitle)}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Your Offer</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.originalAmount.toLocaleString()}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Counter Offer</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${params.counterAmount.toLocaleString()}</td></tr>` +
    `</table></td></tr></table>` +
    // CTA
    `<p style="margin:0 0 20px 0;">View the item and respond to this offer:</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
    `<a href="${escapeHtml(itemUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW ITEM</a>` +
    `</td></tr></table>` +
    `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

  const html = brandedEmailWrapper(bodyHtml);
  await sendMail(to, subject, text, html);
}
