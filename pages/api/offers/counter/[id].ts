// FILE: /pages/api/offers/counter/[id].ts
// Allows sellers to counter an offer with a different price.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";
import { isAdminRequest } from "../../../../utils/adminAuth";
import { brandedEmailWrapper, escapeHtml } from "../../../../utils/email";
import { queueEmail } from "../../../../utils/emailOutbox";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ ok: false, error: "missing_offer_id" });

  const sellerId = await getSellerId(req);
  const isAdmin = isAdminRequest(req);

  const offerDoc = await adminDb.collection("offers").doc(id).get();
  if (!offerDoc.exists) return res.status(404).json({ ok: false, error: "offer_not_found" });

  const offer: any = offerDoc.data() || {};

  if (!isAdmin && (!sellerId || sellerId !== offer.sellerId)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  if (offer.status !== "pending") {
    return res.status(400).json({ ok: false, error: `Offer already ${offer.status}` });
  }

  const { counterAmount } = req.body || {};
  const amount = Number(counterAmount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ ok: false, error: "invalid_counter_amount" });
  }

  await adminDb.collection("offers").doc(id).update({
    status: "countered",
    counterAmount: amount,
    counteredAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Notify buyer via email outbox (guaranteed delivery with retry)
  const buyerEmail = String(offer.buyerEmail || "").trim();
  if (buyerEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
    const itemTitle = String(offer.listingTitle || "");
    const listingId = String(offer.listingId || offer.productId || "");
    const cur = String(offer.currency || "USD");
    const originalAmount = Number(offer.offerAmount);
    const itemUrl = listingId ? `${siteUrl}/product/${listingId}` : siteUrl;

    const text =
      `Hello,\n\n` +
      `The seller has responded to your offer on "${itemTitle}".\n\n` +
      `Your offer: ${cur} $${originalAmount.toLocaleString()}\n` +
      `Counter offer: ${cur} $${amount.toLocaleString()}\n\n` +
      `View the item and respond:\n${itemUrl}\n\n` +
      `Regards,\nThe MyFamousFinds Team\n`;

    const bodyHtml =
      `<p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>` +
      `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">You Received a Counter Offer!</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
      `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
      `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">COUNTER OFFER</p></td></tr>` +
      `<tr><td style="padding:16px 20px;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(itemTitle)}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Your Offer</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${originalAmount.toLocaleString()}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Counter Offer</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${amount.toLocaleString()}</td></tr>` +
      `</table></td></tr></table>` +
      `<p style="margin:0 0 20px 0;">View the item and respond to this offer:</p>` +
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
      `<a href="${escapeHtml(itemUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">VIEW ITEM</a>` +
      `</td></tr></table>` +
      `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

    const html = brandedEmailWrapper(bodyHtml);
    const today = new Date().toISOString().slice(0, 10);

    try {
      const jobId = await queueEmail({
        to: buyerEmail,
        subject: `MyFamousFinds — Counter Offer on "${itemTitle}"`,
        text,
        html,
        eventType: "buyer_counter_offer",
        eventKey: `${id}:buyer_counter_offer:${today}`,
        metadata: { offerId: id, buyerEmail, itemTitle, originalAmount, counterAmount: amount },
      });
      console.log(`[OFFER-COUNTER] Email queued for buyer ${buyerEmail}, jobId: ${jobId}`);
    } catch (err) {
      console.error("Failed to queue counter-offer email:", err);
    }
  }

  return res.status(200).json({ ok: true });
}
