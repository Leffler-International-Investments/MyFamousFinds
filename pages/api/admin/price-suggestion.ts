// FILE: /pages/api/admin/price-suggestion.ts
// Admin can suggest price changes; seller has 24hr to respond
// POST: create a price suggestion for a listing
// GET: list pending price suggestions

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";

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

            const html =
              `<p>Hello ${escapeHtml(sellerName)},</p>` +
              `<p>We'd like to suggest a price adjustment for your listing <b>"${escapeHtml(title)}"</b>.</p>` +
              `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
              `<p style="margin:4px 0;"><b>Current price:</b> US$${currentPrice.toLocaleString()}</p>` +
              `<p style="margin:4px 0;"><b>Suggested price:</b> US$${Number(suggestedPrice).toLocaleString()}</p>` +
              `<p style="margin:4px 0;"><b>Reason:</b> ${escapeHtml(reason || "Market conditions")}</p>` +
              `</div>` +
              `<p><b>You have 24 hours to respond.</b> If you do not respond, the suggested price may be applied.</p>` +
              `<p>To respond, please log in to your <a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/seller/dashboard">Seller Dashboard</a>.</p>` +
              `<p>Regards,<br/>The Famous Finds Team</p>`;

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
