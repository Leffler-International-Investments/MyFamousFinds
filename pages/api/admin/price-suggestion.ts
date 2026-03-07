// FILE: /pages/api/admin/price-suggestion.ts
// Admin can suggest price changes; seller has 24hr to respond
// POST: create a price suggestion for a listing
// GET: list pending price suggestions

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail, brandedEmailWrapper } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const RESPONSE_WINDOW_HOURS = 24;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  if (req.method === "GET") {
    try {
      const snap = await adminDb
        .collection("priceSuggestions")
        .where("status", "==", "pending")
        .get();

      const suggestions = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          listingId: data.listingId,
          sellerId: data.sellerId,
          currentPrice: data.currentPrice,
          suggestedPrice: data.suggestedPrice,
          reason: data.reason,
          status: data.status,
          createdAt: data.createdAt?.toMillis?.() || 0,
          expiresAt: data.expiresAt || 0,
        };
      });

      return res.status(200).json({ ok: true, suggestions });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { action, listingId, suggestedPrice, reason, suggestionId } =
        req.body || {};

      if (action === "create" && listingId) {
        // Create new price suggestion
        const listingDoc = await adminDb.collection("listings").doc(listingId).get();
        if (!listingDoc.exists) {
          return res.status(404).json({ ok: false, error: "listing_not_found" });
        }

        const listingData = listingDoc.data() as any;
        const currentPrice = Number(listingData.price || listingData.priceUsd || 0);
        const sellerId = listingData.sellerId || "";

        if (!sellerId) {
          return res.status(400).json({ ok: false, error: "no_seller_id" });
        }

        const expiresAt = Date.now() + RESPONSE_WINDOW_HOURS * 60 * 60 * 1000;

        const suggestionRef = adminDb.collection("priceSuggestions").doc();
        await suggestionRef.set({
          listingId,
          sellerId,
          currentPrice,
          suggestedPrice: Number(suggestedPrice),
          reason: reason || "Market conditions suggest this price adjustment",
          status: "pending",
          expiresAt,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Send email to seller
        const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
        if (sellerDoc.exists) {
          const sellerData = sellerDoc.data() as any;
          const sellerEmail = sellerData.email || sellerData.contactEmail || "";
          const sellerName = sellerData.businessName || sellerData.contactName || "Seller";

          if (sellerEmail) {
            const title = listingData.title || "Your listing";
            const subject = `Famous Finds — Price Suggestion for "${title}"`;
            const text =
              `Hello ${sellerName},\n\n` +
              `We'd like to suggest a price adjustment for your listing "${title}".\n\n` +
              `Current price: US$${currentPrice.toLocaleString()}\n` +
              `Suggested price: US$${Number(suggestedPrice).toLocaleString()}\n` +
              `Reason: ${reason || "Market conditions"}\n\n` +
              `You have 24 hours to respond to this suggestion. ` +
              `If you do not respond, the suggested price may be applied.\n\n` +
              `To respond, please log in to your Seller Dashboard.\n\n` +
              `Regards,\nThe Famous Finds Team`;

            const bodyHtml =
              `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(sellerName)},</p>` +
              `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Price Suggestion for Your Listing</p>` +
              `<p style="margin:0 0 12px 0;">We'd like to suggest a price adjustment for your listing <b>&ldquo;${escapeHtml(title)}&rdquo;</b>.</p>` +
              `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
              `<tr><td style="padding:16px 20px;">` +
              `<p style="margin:0 0 6px 0;font-size:15px;"><b>Current price:</b> US$${currentPrice.toLocaleString()}</p>` +
              `<p style="margin:0 0 6px 0;font-size:15px;"><b>Suggested price:</b> US$${Number(suggestedPrice).toLocaleString()}</p>` +
              `<p style="margin:0;font-size:15px;"><b>Reason:</b> ${escapeHtml(reason || "Market conditions")}</p>` +
              `</td></tr></table>` +
              `<p style="margin:0 0 12px 0;"><b>You have 24 hours to respond.</b> If you do not respond, the suggested price may be applied.</p>` +
              `<p style="margin:0 0 20px 0;text-align:center;">` +
              `<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/seller/dashboard" style="display:inline-block;padding:14px 36px;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">VIEW SELLER DASHBOARD</a>` +
              `</p>` +
              `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">Regards,<br/>The Famous Finds Team</p>`;
            const html = brandedEmailWrapper(bodyHtml);

            try {
              await sendMail(sellerEmail, subject, text, html);
            } catch (emailErr) {
              console.error("Price suggestion email failed:", emailErr);
            }
          }
        }

        return res.status(200).json({ ok: true, suggestionId: suggestionRef.id });
      }

      if (action === "apply_expired") {
        // Apply suggestions that have expired without response
        const now = Date.now();
        const expired = await adminDb
          .collection("priceSuggestions")
          .where("status", "==", "pending")
          .get();

        let applied = 0;
        for (const doc of expired.docs) {
          const data = doc.data() as any;
          if (data.expiresAt && data.expiresAt <= now) {
            // Apply the suggested price
            await adminDb.collection("listings").doc(data.listingId).update({
              price: data.suggestedPrice,
              priceUsd: data.suggestedPrice,
              priceAdjustedAt: FieldValue.serverTimestamp(),
              priceAdjustedFrom: data.currentPrice,
            });
            await doc.ref.update({ status: "applied_auto" });
            applied++;
          }
        }
        return res.status(200).json({ ok: true, applied });
      }

      if (action === "respond" && suggestionId) {
        const { response } = req.body;
        const suggDoc = await adminDb.collection("priceSuggestions").doc(suggestionId).get();
        if (!suggDoc.exists) {
          return res.status(404).json({ ok: false, error: "suggestion_not_found" });
        }

        if (response === "accept") {
          const data = suggDoc.data() as any;
          await adminDb.collection("listings").doc(data.listingId).update({
            price: data.suggestedPrice,
            priceUsd: data.suggestedPrice,
            priceAdjustedAt: FieldValue.serverTimestamp(),
            priceAdjustedFrom: data.currentPrice,
          });
          await suggDoc.ref.update({ status: "accepted" });
        } else {
          await suggDoc.ref.update({ status: "declined" });
        }

        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: "invalid_action" });
    } catch (err: any) {
      console.error("admin/price-suggestion error", err);
      return res.status(500).json({ ok: false, error: err?.message || "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
