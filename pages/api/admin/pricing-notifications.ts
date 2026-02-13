// FILE: /pages/api/admin/pricing-notifications.ts
// Dynamic pricing: send email notifications to sellers after 7 days with no views
// Suggest market-based price reductions (5-10%)
// Designed to be called by a cron job or manual admin trigger

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";

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

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get all live listings
    const listingsSnap = await adminDb
      .collection("listings")
      .where("status", "in", ["Live", "Active", "Approved"])
      .get();

    let notificationsSent = 0;
    const errors: string[] = [];

    for (const doc of listingsSnap.docs) {
      const data = doc.data() as any;

      // Skip if already notified recently
      if (data.pricingNotifiedAt && data.pricingNotifiedAt.toMillis?.() > sevenDaysAgo) {
        continue;
      }

      const createdAt = data.createdAt?.toMillis?.() || 0;
      const viewCount = data.viewCount || 0;

      // Only notify if listing is > 7 days old and has 0 views
      if (createdAt > sevenDaysAgo || viewCount > 0) {
        continue;
      }

      const price = Number(data.price || data.priceUsd || 0);
      if (price <= 0) continue;

      // Calculate suggested prices (5% and 10% reduction)
      const suggestedPrice5 = Math.round(price * 0.95);
      const suggestedPrice10 = Math.round(price * 0.90);

      // Get seller email
      const sellerId = data.sellerId;
      if (!sellerId) continue;

      const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
      if (!sellerDoc.exists) continue;

      const sellerData = sellerDoc.data() as any;
      const sellerEmail =
        sellerData.email || sellerData.contactEmail || "";
      if (!sellerEmail) continue;

      const sellerName = sellerData.businessName || sellerData.contactName || "Seller";
      const title = data.title || "Your listing";

      try {
        const subject = `Famous Finds — Pricing Suggestion for "${title}"`;
        const text =
          `Hello ${sellerName},\n\n` +
          `Your listing "${title}" has been live for over 7 days and hasn't received any views yet.\n\n` +
          `We recommend adjusting the price to attract more buyers:\n\n` +
          `Current price: US$${price.toLocaleString()}\n` +
          `Suggested price (5% off): US$${suggestedPrice5.toLocaleString()}\n` +
          `Suggested price (10% off): US$${suggestedPrice10.toLocaleString()}\n\n` +
          `Market-competitive pricing helps your items sell faster.\n\n` +
          `You can update your price in the Seller Dashboard.\n\n` +
          `Regards,\nThe Famous Finds Team`;

        const html =
          `<p>Hello ${escapeHtml(sellerName)},</p>` +
          `<p>Your listing <b>"${escapeHtml(title)}"</b> has been live for over 7 days and hasn't received any views yet.</p>` +
          `<p>We recommend adjusting the price to attract more buyers:</p>` +
          `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
          `<p style="margin:4px 0;"><b>Current price:</b> US$${price.toLocaleString()}</p>` +
          `<p style="margin:4px 0;"><b>Suggested (5% off):</b> US$${suggestedPrice5.toLocaleString()}</p>` +
          `<p style="margin:4px 0;"><b>Suggested (10% off):</b> US$${suggestedPrice10.toLocaleString()}</p>` +
          `</div>` +
          `<p>Market-competitive pricing helps your items sell faster.</p>` +
          `<p>You can update your price in the <a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/seller/dashboard">Seller Dashboard</a>.</p>` +
          `<p>Regards,<br/>The Famous Finds Team</p>`;

        await sendMail(sellerEmail, subject, text, html);
        notificationsSent++;

        // Mark listing as notified
        await adminDb.collection("listings").doc(doc.id).update({
          pricingNotifiedAt: FieldValue.serverTimestamp(),
        });
      } catch (emailErr: any) {
        errors.push(`${doc.id}: ${emailErr?.message || "email_failed"}`);
      }
    }

    return res.status(200).json({
      ok: true,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("admin/pricing-notifications error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
