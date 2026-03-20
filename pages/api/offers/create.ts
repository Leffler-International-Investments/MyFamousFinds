// FILE: /pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";
import { brandedEmailWrapper, escapeHtml } from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

type Ok = { ok: true; offerId: string };
type Err = { ok: false; error: string };

function toPositiveNumber(v: any): number | null {
  const n = typeof v === "number" ? v : Number(String(v || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const buyerId = await getUserId(req);
  if (!buyerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { productId, price, offerValue, offerAmount, buyerEmail, message } = req.body || {};
  if (!productId) return res.status(400).json({ ok: false, error: "missing_productId" });

  const resolved = toPositiveNumber(price ?? offerValue ?? offerAmount);
  if (!resolved) return res.status(400).json({ ok: false, error: "invalid_offer_amount" });

  const listing = await adminDb.collection("listings").doc(String(productId)).get();
  if (!listing.exists) return res.status(404).json({ ok: false, error: "listing_not_found" });

  const L: any = listing.data() || {};
  const sellerId = String(L.sellerId || "");
  const listingTitle = String(L.title || L.name || "");
  const listingBrand = String(L.brand || L.designer || "");
  const listingPrice = typeof L.price === "number" ? L.price : undefined;
  const currency = String(L.currency || "USD");

  const ref = await adminDb.collection("offers").add({
    listingId: String(productId),
    productId: String(productId),
    sellerId,
    buyerId: String(buyerId),
    buyerEmail: String(buyerEmail || ""),
    listingTitle,
    listingBrand,
    offerAmount: resolved,
    offerPrice: resolved,
    currency,
    message: String(message || ""),
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Email the seller about the new offer via outbox (guaranteed delivery)
  if (sellerId) {
    try {
      const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
      const sellerData: any = sellerDoc.exists ? sellerDoc.data() : {};
      const sellerEmail =
        sellerData?.email || sellerData?.contactEmail || sellerData?.contact_email || "";
      const sellerName = sellerData?.businessName || sellerData?.name || sellerData?.contactName || "";

      if (sellerEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
        const cur = currency;
        const msgText = String(message || "").trim();

        const text =
          `Hello ${sellerName || "Seller"},\n\n` +
          `You have received a new offer on your listing!\n\n` +
          `Item: ${listingTitle}\n` +
          (listingPrice ? `Listing price: ${cur} $${listingPrice.toLocaleString()}\n` : "") +
          `Offer amount: ${cur} $${resolved.toLocaleString()}\n` +
          `Buyer: ${buyerEmail || "N/A"}\n` +
          (msgText ? `Message: ${msgText}\n` : "") +
          `\nView and respond to this offer in your Seller Dashboard:\n` +
          `${siteUrl}/seller/offers\n\n` +
          `Regards,\nThe MyFamousFinds Team\n`;

        const bodyHtml =
          `<p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(sellerName || "Seller")},</p>` +
          `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">You Have Received a New Offer!</p>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
          `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
          `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">OFFER DETAILS</p></td></tr>` +
          `<tr><td style="padding:16px 20px;">` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
          `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(listingTitle)}</td></tr>` +
          (listingPrice ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Listing Price</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${listingPrice.toLocaleString()}</td></tr>` : "") +
          `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Offer Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${resolved.toLocaleString()}</td></tr>` +
          `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Buyer</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(String(buyerEmail || "N/A"))}</td></tr>` +
          (msgText ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Message</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(msgText)}</td></tr>` : "") +
          `</table></td></tr></table>` +
          `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
          `<a href="${escapeHtml(siteUrl)}/seller/offers" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW OFFERS</a>` +
          `</td></tr></table>` +
          `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for selling with Famous Finds.</p>`;

        const html = brandedEmailWrapper(bodyHtml);
        const today = new Date().toISOString().slice(0, 10);

        const jobId = await queueEmail({
          to: sellerEmail,
          subject: `MyFamousFinds — New Offer on "${listingTitle}"`,
          text,
          html,
          eventType: "seller_new_offer",
          eventKey: `${ref.id}:seller_new_offer:${today}`,
          metadata: { offerId: ref.id, sellerId, sellerEmail, listingTitle, offerAmount: resolved },
        });
        console.log(`[OFFER-CREATE] Email queued for seller ${sellerEmail}, jobId: ${jobId}`);
      }
    } catch (err) {
      console.error("Error looking up seller for offer email:", err);
    }
  }

  return res.status(201).json({ ok: true, offerId: ref.id });
}
