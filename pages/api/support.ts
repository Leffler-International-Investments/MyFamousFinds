// FILE: /pages/api/support.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { sendMail } from "../../utils/email";

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
  const recipientEmail =
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0]?.trim() ||
    "admin@myfamousfinds.com";

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

  // Send email notification
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

    await sendMail(recipientEmail, subjectLine, text, html);
  } catch (err) {
    console.error("[SUPPORT] Email send failed:", err);
    // Still return success — the ticket is saved in Firestore
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
