// FILE: /pages/api/authentication-complaint.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { sendMail } from "../../utils/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, orderNumber, itemDescription, concern } =
    req.body || {};

  if (!name || !email || !concern) {
    return res
      .status(400)
      .json({ ok: false, error: "Please fill in all required fields." });
  }

  // Generate a short complaint reference ID
  const refId = "AC-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const recipientEmail =
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0]?.trim() ||
    "Support@MyFamousFinds.com";

  // Save to Firestore so management dashboard can view it
  try {
    if (adminDb) {
      await adminDb.collection("authenticationComplaints").doc(refId).set({
        refId,
        fromName: String(name).trim(),
        fromEmail: String(email).trim().toLowerCase(),
        orderNumber: orderNumber ? String(orderNumber).trim() : "",
        itemDescription: itemDescription ? String(itemDescription).trim() : "",
        concern: String(concern).trim(),
        status: "Open",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("[AUTH-COMPLAINT] Firestore write failed:", err);
  }

  // Send email notification to support
  try {
    const subjectLine = `[Authentication Complaint] Ref #${refId} — from ${name}`;

    const text =
      `New Authentication Complaint\n\n` +
      `Reference: #${refId}\n` +
      `From: ${name} <${email}>\n` +
      `Order Number: ${orderNumber || "Not provided"}\n` +
      `Item: ${itemDescription || "Not provided"}\n\n` +
      `Concern:\n${concern}\n\n` +
      `— Famous Finds Authentication Complaint Form`;

    const html =
      `<div style="font-family:sans-serif;max-width:600px;">` +
      `<h2 style="margin:0 0 12px;color:#111827;">Authentication Complaint Received</h2>` +
      `<table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Reference</td><td style="padding:4px 0;font-weight:600;">#${refId}</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">From</td><td style="padding:4px 0;">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Order Number</td><td style="padding:4px 0;">${escapeHtml(orderNumber || "Not provided")}</td></tr>` +
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Item</td><td style="padding:4px 0;">${escapeHtml(itemDescription || "Not provided")}</td></tr>` +
      `</table>` +
      `<div style="padding:14px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">` +
      `<p style="margin:0 0 4px;font-weight:600;color:#991b1b;">Authenticity Concern:</p>` +
      `<p style="margin:0;white-space:pre-wrap;color:#111827;">${escapeHtml(concern)}</p>` +
      `</div>` +
      `<p style="margin-top:16px;font-size:12px;color:#9ca3af;">Famous Finds — Authentication Complaint Form</p>` +
      `</div>`;

    await sendMail(recipientEmail, subjectLine, text, html);
  } catch (err) {
    console.error("[AUTH-COMPLAINT] Email send failed:", err);
  }

  return res.status(201).json({ ok: true, refId });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
