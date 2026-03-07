// FILE: /pages/api/admin/reengagement.ts
// Automated re-engagement campaigns — target previous purchasers after 6-12 months
// "Ready to consign that red dress?" messaging via email
// Designed to be called by a cron job or manual admin trigger

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail, brandedEmailWrapper } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  try {
    const now = Date.now();
    const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
    const twelveMonthsAgo = now - 12 * 30 * 24 * 60 * 60 * 1000;

    // Get orders from 6-12 months ago
    const ordersSnap = await adminDb.collection("orders").get();

    type CampaignTarget = {
      email: string;
      buyerName: string;
      items: { title: string; brand: string }[];
    };

    const targets = new Map<string, CampaignTarget>();

    for (const doc of ordersSnap.docs) {
      const data = doc.data() as any;
      const createdAt = data.createdAt?.toMillis?.() || 0;

      // Only target orders from 6-12 months ago
      if (createdAt > sixMonthsAgo || createdAt < twelveMonthsAgo) {
        continue;
      }

      const buyerEmail = String(data.buyerEmail || "").trim().toLowerCase();
      if (!buyerEmail || !buyerEmail.includes("@")) continue;

      // Check if already sent a re-engagement email recently (30 days)
      const reengagementCheck = await adminDb
        .collection("reengagementLog")
        .doc(buyerEmail.replace(/\./g, "_"))
        .get();

      if (reengagementCheck.exists) {
        const logData = reengagementCheck.data() as any;
        const lastSent = logData.lastSentAt?.toMillis?.() || 0;
        if (now - lastSent < 30 * 24 * 60 * 60 * 1000) continue;
      }

      const existing = targets.get(buyerEmail);
      const itemInfo = {
        title: data.listingTitle || data.title || "your purchase",
        brand: data.listingBrand || data.brand || "",
      };

      if (existing) {
        existing.items.push(itemInfo);
      } else {
        targets.set(buyerEmail, {
          email: buyerEmail,
          buyerName: data.buyerName || "",
          items: [itemInfo],
        });
      }
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const [email, target] of targets) {
      try {
        const name = target.buyerName || "there";
        const topItem = target.items[0];
        const itemDesc = topItem.brand
          ? `${topItem.brand} ${topItem.title}`
          : topItem.title;

        const subject = `Ready to consign that ${itemDesc}?`;
        const text =
          `Hello ${name},\n\n` +
          `It's been a while since you purchased "${itemDesc}" on Famous Finds.\n\n` +
          `Have you thought about consigning it? Pre-loved luxury is in demand, ` +
          `and your item could find a new home while earning you money.\n\n` +
          `Here's how it works:\n` +
          `1. Apply to become a seller (it's free)\n` +
          `2. List your items with photos\n` +
          `3. We handle the rest — from authentication to shipping\n\n` +
          `Start consigning today:\n` +
          `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com"}/become-seller\n\n` +
          `Or browse what's new:\n` +
          `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com"}\n\n` +
          `Regards,\nThe Famous Finds Team`;

        const bodyHtml =
          `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(name)},</p>` +
          `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Ready to Consign?</p>` +
          `<p style="margin:0 0 12px 0;">It's been a while since you purchased <b>&ldquo;${escapeHtml(itemDesc)}&rdquo;</b> on Famous Finds.</p>` +
          `<p style="margin:0 0 12px 0;">Have you thought about consigning it? Pre-loved luxury is in demand, ` +
          `and your item could find a new home while earning you money.</p>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
          `<tr><td style="padding:16px 20px;">` +
          `<p style="margin:0 0 6px 0;font-weight:bold;">Here's how it works:</p>` +
          `<ol style="margin:0;padding-left:18px;line-height:1.8;">` +
          `<li>Apply to become a seller (it's free)</li>` +
          `<li>List your items with photos</li>` +
          `<li>We handle the rest — from authentication to shipping</li>` +
          `</ol>` +
          `</td></tr></table>` +
          `<p style="margin:0 0 20px 0;text-align:center;">` +
          `<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/become-seller" ` +
          `style="display:inline-block;padding:14px 36px;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">START CONSIGNING</a>` +
          `</p>` +
          `<p style="margin:0 0 12px 0;font-size:13px;color:#78716c;">Or ` +
          `<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}" style="color:#b8860b;text-decoration:none;">browse what's new</a></p>` +
          `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">Regards,<br/>The Famous Finds Team</p>`;
        const html = brandedEmailWrapper(bodyHtml);

        await sendMail(email, subject, text, html);
        emailsSent++;

        // Log the re-engagement email
        await adminDb
          .collection("reengagementLog")
          .doc(email.replace(/\./g, "_"))
          .set({
            email,
            lastSentAt: FieldValue.serverTimestamp(),
            itemsMentioned: target.items.map((i) => i.title),
          });
      } catch (emailErr: any) {
        errors.push(`${email}: ${emailErr?.message || "email_failed"}`);
      }
    }

    return res.status(200).json({
      ok: true,
      targetsFound: targets.size,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("admin/reengagement error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
