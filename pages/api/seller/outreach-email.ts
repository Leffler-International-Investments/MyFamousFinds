// FILE: /pages/api/seller/outreach-email.ts
// Sends branded outreach email on behalf of a seller to a list of contacts,
// showcasing their listings with item cards and purchase links.
// POST body: { contacts: string[], subject: string, message: string, items: OutreachItem[], sellerName: string }

import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import { sendMail, brandedEmailWrapper, escapeHtml } from "../../../utils/email";

type OutreachItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  brand?: string;
};

type ReqBody = {
  contacts: string[];
  subject?: string;
  message?: string;
  items: OutreachItem[];
  sellerName?: string;
};

type Result =
  | { ok: true; sent: number; failed: string[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { contacts, subject, message, items, sellerName }: ReqBody =
    req.body || {};

  if (!contacts?.length) {
    return res.status(400).json({ ok: false, error: "No contacts provided" });
  }
  if (!items?.length) {
    return res.status(400).json({ ok: false, error: "No items provided" });
  }
  if (contacts.length > 50) {
    return res
      .status(400)
      .json({ ok: false, error: "Maximum 50 contacts per send" });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
  const displayName = escapeHtml(sellerName || "A Famous Finds seller");
  const emailSubject =
    subject?.trim() ||
    `${sellerName || "Someone"} is sharing exclusive items with you on Famous Finds`;
  const personalMessage = message?.trim()
    ? `<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;font-style:italic;">${escapeHtml(message)}</p>`
    : "";

  // Build item cards HTML
  const itemCardsHtml = items
    .map((item) => {
      const itemUrl = `${siteUrl}/product/${encodeURIComponent(item.id)}`;
      const imgHtml = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" width="120" height="120" style="width:120px;height:120px;object-fit:cover;border-radius:8px;display:block;" />`
        : `<div style="width:120px;height:120px;border-radius:8px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;font-size:28px;">👜</div>`;
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;border:1px solid #e7e5e4;border-radius:10px;overflow:hidden;">` +
        `<tr>` +
        `<td style="padding:16px;vertical-align:top;width:136px;">${imgHtml}</td>` +
        `<td style="padding:16px 16px 16px 0;vertical-align:top;">` +
        (item.brand
          ? `<p style="margin:0 0 2px 0;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#b8860b;text-transform:uppercase;">${escapeHtml(item.brand)}</p>`
          : "") +
        `<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#1c1917;">${escapeHtml(item.title)}</p>` +
        `<p style="margin:0 0 14px 0;font-size:18px;font-weight:bold;color:#1c1917;">US$${Number(item.price).toLocaleString("en-US")}</p>` +
        `<a href="${escapeHtml(itemUrl)}" style="display:inline-block;background:#1c1917;color:#d4a843;text-decoration:none;font-size:13px;font-weight:bold;padding:9px 20px;border-radius:999px;letter-spacing:0.04em;">View &amp; Purchase →</a>` +
        `</td>` +
        `</tr>` +
        `</table>`
      );
    })
    .join("");

  const bodyHtml =
    `<p style="margin:0 0 6px 0;font-size:13px;font-weight:600;color:#b8860b;letter-spacing:0.06em;text-transform:uppercase;">Private Invitation</p>` +
    `<p style="margin:0 0 20px 0;font-size:22px;font-weight:bold;color:#1c1917;line-height:1.3;">${displayName} is sharing exclusive items with you</p>` +
    personalMessage +
    `<p style="margin:0 0 16px 0;font-size:14px;color:#57534e;">Here are the items available for you on <strong>MyFamousFinds.com</strong>:</p>` +
    itemCardsHtml +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 0 0;">` +
    `<tr><td style="text-align:center;padding:20px;background:#fafaf9;border-radius:8px;border:1px solid #e7e5e4;">` +
    `<p style="margin:0 0 12px 0;font-size:14px;color:#78716c;">Explore all authenticated luxury items on</p>` +
    `<a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:linear-gradient(90deg,#b8860b,#d4a843);color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 32px;border-radius:999px;letter-spacing:0.04em;">Shop Famous Finds</a>` +
    `</td></tr>` +
    `</table>` +
    `<p style="margin:24px 0 0 0;font-size:12px;color:#a8a29e;text-align:center;">You received this email because ${displayName} personally invited you. This is not a marketing list.</p>`;

  const htmlBody = brandedEmailWrapper(bodyHtml);

  const textBody =
    `${sellerName || "A Famous Finds seller"} is sharing exclusive items with you on MyFamousFinds.com\n\n` +
    (message ? `${message}\n\n` : "") +
    items
      .map(
        (item) =>
          `• ${item.title} — US$${Number(item.price).toLocaleString("en-US")}\n  ${siteUrl}/product/${item.id}`
      )
      .join("\n") +
    `\n\nShop all items: ${siteUrl}`;

  const failed: string[] = [];
  let sent = 0;

  for (const email of contacts) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      failed.push(email);
      continue;
    }
    try {
      await sendMail(trimmed, emailSubject, textBody, htmlBody);
      sent++;
    } catch (err: any) {
      console.error("[outreach-email] Failed to send to", trimmed, err?.message);
      failed.push(trimmed);
    }
  }

  return res.status(200).json({ ok: true, sent, failed });
}
