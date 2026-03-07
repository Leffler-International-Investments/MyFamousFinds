// FILE: /pages/api/support.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { sendMail, normalizeAdminEmail, brandedEmailWrapper, escapeHtml as escapeHtmlUtil } from "../../utils/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, topic, message } = req.body || {};

  if (!name || !email || !topic || !message) {
    return res.status(400).json({ ok: false, error: "Please fill in all required fields." });
  }

  // Generate a short ticket ID
  const ticketId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const destination = "support";
  // Send to the admin inbox (which actually exists), not support@
  // which has no inbound mailbox configured yet.
  const recipientEmail = normalizeAdminEmail(
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0]?.trim() ||
    "admin@myfamousfinds.com"
  );

  // Save to Firestore so the management dashboard can view it
  try {
    if (adminDb) {
      await adminDb.collection("supportTickets").doc(ticketId).set({
        ticketId,
        fromName: String(name).trim(),
        fromEmail: String(email).trim().toLowerCase(),
        subject: String(topic).trim(),
        sendTo: destination,
        message: String(message).trim(),
        status: "Open",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("[SUPPORT] Firestore write failed:", err);
    // Continue — email send is still valuable even if Firestore is down
  }

  // Send internal notification to admin/support
  try {
    const subjectLine = `[Contact Form] ${topic} — Ticket #${ticketId}`;

    const text =
      `New contact form submission\n\n` +
      `Ticket: #${ticketId}\n` +
      `From: ${name} <${email}>\n` +
      `Subject: ${topic}\n` +
      `Sent To: ${destination}\n\n` +
      `Message:\n${message}\n\n` +
      `— MyFamousFinds Contact Form`;

    const html =
      `<div style="font-family:sans-serif;max-width:600px;">` +
      `<h2 style="margin:0 0 12px;">New Contact Form Submission</h2>` +
      `<table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Ticket</td><td style="padding:4px 0;">#${ticketId}</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">From</td><td style="padding:4px 0;">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Subject</td><td style="padding:4px 0;">${escapeHtml(topic)}</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Sent To</td><td style="padding:4px 0;">${destination}</td></tr>` +
      `</table>` +
      `<div style="padding:14px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">` +
      `<p style="margin:0 0 4px;font-weight:500;color:#374151;">Message:</p>` +
      `<p style="margin:0;white-space:pre-wrap;color:#111827;">${escapeHtml(message)}</p>` +
      `</div>` +
      `<p style="margin-top:16px;font-size:12px;color:#9ca3af;">MyFamousFinds Contact Form</p>` +
      `</div>`;

    // Send to primary recipient
    await sendMail(recipientEmail, subjectLine, text, html);

    // Also send to SUPPORT_INBOX if it differs from the primary recipient
    const supportInbox = (process.env.SUPPORT_INBOX || "").trim();
    if (supportInbox && supportInbox !== recipientEmail) {
      await sendMail(supportInbox, subjectLine, text, html).catch((e) =>
        console.error("[SUPPORT] Support inbox email failed:", e)
      );
    }
  } catch (err) {
    console.error("[SUPPORT] Email send failed:", err);
    // Still return success — the ticket is saved in Firestore
  }

  // Send confirmation email to the person who submitted the form
  try {
    const userEmail = String(email).trim();
    const userName = String(name).trim();

    const confirmSubject = `Famous Finds — We received your message (Ticket #${ticketId})`;
    const confirmText =
      `Hello ${userName},\n\n` +
      `Thank you for contacting MyFamousFinds support.\n\n` +
      `We have received your message and a support ticket has been created:\n\n` +
      `Ticket #: ${ticketId}\n` +
      `Subject: ${topic}\n\n` +
      `Our team will get back to you as soon as possible.\n\n` +
      `Regards,\n` +
      `MyFamousFinds Support Team\n` +
      `support@myfamousfinds.com\n`;

    const confirmBodyHtml =
      `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(userName)},</p>` +
      `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">We Received Your Message</p>` +
      `<p style="margin:0 0 12px 0;">Thank you for contacting <b>Famous Finds</b> support.</p>` +
      `<p style="margin:0 0 16px 0;">We have received your message and a support ticket has been created:</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
      `<tr><td style="padding:16px 20px;">` +
      `<p style="margin:0 0 6px 0;font-size:15px;"><b>Ticket #:</b> ${ticketId}</p>` +
      `<p style="margin:0;font-size:15px;"><b>Subject:</b> ${escapeHtml(topic)}</p>` +
      `</td></tr></table>` +
      `<p style="margin:0 0 12px 0;">Our team will get back to you as soon as possible.</p>` +
      `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">Regards,<br/>Famous Finds Support Team<br/>` +
      `<a href="mailto:support@myfamousfinds.com" style="color:#b8860b;text-decoration:none;">support@myfamousfinds.com</a></p>`;
    const confirmHtml = brandedEmailWrapper(confirmBodyHtml);

    await sendMail(userEmail, confirmSubject, confirmText, confirmHtml);
  } catch (err) {
    console.error("[SUPPORT] User confirmation email failed:", err);
    // Still return success — the ticket is saved and admin was notified
  }

  return res.status(201).json({ ok: true, ticketId });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
