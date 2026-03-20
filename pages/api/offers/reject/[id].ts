// FILE: /pages/api/offers/reject/[id].ts
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

  // Allow either the seller who owns the listing OR an admin
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

  const reason = String(req.body?.reason || "").trim();

  await adminDb.collection("offers").doc(id).update({
    status: "rejected",
    rejectionReason: reason,
    respondedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Notify buyer via email outbox (guaranteed delivery with retry)
  const buyerEmail = String(offer.buyerEmail || "").trim();
  if (buyerEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
    const itemTitle = String(offer.listingTitle || "");
    const offerAmount = Number(offer.offerAmount || 0);
    const cur = String(offer.currency || "USD");

    const text =
      `Hello,\n\n` +
      `Unfortunately, your offer on "${itemTitle}" for ${cur} $${offerAmount.toLocaleString()} was not accepted.\n\n` +
      (reason ? `Seller's note: ${reason}\n\n` : "") +
      `You can browse more items or make a new offer on MyFamousFinds.\n` +
      `${siteUrl}\n\n` +
      `Regards,\nThe MyFamousFinds Team\n`;

    const bodyHtml =
      `<p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>` +
      `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Offer Update</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;margin:0 0 20px 0;">` +
      `<tr><td style="padding:16px 20px;border-bottom:1px solid #e7e5e4;background-color:#1c1917;border-radius:8px 8px 0 0;">` +
      `<p style="margin:0;font-size:14px;font-weight:bold;color:#d4a843;letter-spacing:0.5px;">OFFER DETAILS</p></td></tr>` +
      `<tr><td style="padding:16px 20px;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;width:110px;">Item</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(itemTitle)}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Offer Amount</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">${escapeHtml(cur)} $${offerAmount.toLocaleString()}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Status</td><td style="padding:6px 0;font-size:14px;font-weight:bold;color:#1c1917;">Not Accepted</td></tr>` +
      (reason ? `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;">Seller's Note</td><td style="padding:6px 0;font-size:14px;color:#1c1917;">${escapeHtml(reason)}</td></tr>` : "") +
      `</table></td></tr></table>` +
      `<p style="margin:0 0 20px 0;">You can browse more items or make a new offer on MyFamousFinds.</p>` +
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
      `<a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">BROWSE ITEMS</a>` +
      `</td></tr></table>` +
      `<p style="margin:20px 0 0 0;font-size:14px;color:#78716c;">Thank you for shopping with Famous Finds.</p>`;

    const html = brandedEmailWrapper(bodyHtml);
    const today = new Date().toISOString().slice(0, 10);

    try {
      const jobId = await queueEmail({
        to: buyerEmail,
        subject: `MyFamousFinds — Offer Update for "${itemTitle}"`,
        text,
        html,
        eventType: "buyer_offer_rejected",
        eventKey: `${id}:buyer_offer_rejected:${today}`,
        metadata: { offerId: id, buyerEmail, itemTitle, offerAmount, reason },
      });
      console.log(`[OFFER-REJECT] Email queued for buyer ${buyerEmail}, jobId: ${jobId}`);
    } catch (err) {
      console.error("Failed to queue offer rejected email:", err);
    }
  }

  return res.status(200).json({ ok: true });
}
