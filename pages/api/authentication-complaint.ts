// FILE: /pages/api/authentication-complaint.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { sendMail, normalizeAdminEmail } from "../../utils/email";

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

  const recipientEmail = normalizeAdminEmail(
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0]?.trim() ||
    "Support@MyFamousFinds.com"
  );

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

  // Propagate authentication complaint to disputes so management can track it there too
  try {
    if (adminDb) {
      await adminDb.collection("disputes").add({
        orderId: orderNumber ? String(orderNumber).trim() : "",
        openedBy: String(email).trim().toLowerCase(),
        buyerEmail: String(email).trim().toLowerCase(),
        sellerEmail: "",
        role: "Buyer",
        reason: `Authentication Complaint (Ref #${refId}): ${String(itemDescription || "").trim()}`,
        details: String(concern).trim(),
        status: "OPEN",
        source: "authentication-complaint",
        complaintRefId: refId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("[AUTH-COMPLAINT] Dispute propagation failed:", err);
  }

  // Send email notification to support/admin
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

    // Also send to SUPPORT_INBOX if different from primary recipient
    const supportInbox = (process.env.SUPPORT_INBOX || "").trim();
    if (supportInbox && supportInbox !== recipientEmail) {
      await sendMail(supportInbox, subjectLine, text, html).catch((e) =>
        console.error("[AUTH-COMPLAINT] Support inbox email failed:", e)
      );
    }
  } catch (err) {
    console.error("[AUTH-COMPLAINT] Email send failed:", err);
  }

  // Send confirmation email to the person who submitted the complaint
  try {
    const userEmail = String(email).trim();
    const userName = String(name).trim();

    const confirmSubject = `MyFamousFinds — Authenticity Complaint Received (Ref #${refId})`;
    const confirmText =
      `Hello ${userName},\n\n` +
      `Thank you for contacting MyFamousFinds regarding your authenticity concern.\n\n` +
      `We take authenticity very seriously and your complaint has been logged:\n\n` +
      `Reference #: ${refId}\n` +
      `Order Number: ${orderNumber || "Not provided"}\n` +
      `Item: ${itemDescription || "Not provided"}\n\n` +
      `Our team will investigate and get back to you as soon as possible.\n\n` +
      `Regards,\n` +
      `MyFamousFinds Support Team\n` +
      `support@myfamousfinds.com\n`;

    const confirmHtml =
      `<div style="font-family:sans-serif;max-width:600px;">` +
      `<p>Hello ${escapeHtml(userName)},</p>` +
      `<p>Thank you for contacting <b>MyFamousFinds</b> regarding your authenticity concern.</p>` +
      `<p>We take authenticity very seriously and your complaint has been logged:</p>` +
      `<div style="padding:14px;background:#fef2f2;border-radius:8px;margin:12px 0;border:1px solid #fecaca;">` +
      `<p style="margin:4px 0;"><b>Reference #:</b> ${refId}</p>` +
      `<p style="margin:4px 0;"><b>Order Number:</b> ${escapeHtml(orderNumber || "Not provided")}</p>` +
      `<p style="margin:4px 0;"><b>Item:</b> ${escapeHtml(itemDescription || "Not provided")}</p>` +
      `</div>` +
      `<p>Our team will investigate and get back to you as soon as possible.</p>` +
      `<p>Regards,<br/>MyFamousFinds Support Team<br/>` +
      `<a href="mailto:support@myfamousfinds.com">support@myfamousfinds.com</a></p>` +
      `</div>`;

    await sendMail(userEmail, confirmSubject, confirmText, confirmHtml);
  } catch (err) {
    console.error("[AUTH-COMPLAINT] User confirmation email failed:", err);
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
