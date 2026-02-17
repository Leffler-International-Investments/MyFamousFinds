// FILE: /pages/api/offers/counter/[id].ts
// Allows sellers to counter an offer with a different price.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";
import { isAdminRequest } from "../../../../utils/adminAuth";
import { sendMail } from "../../../../utils/email";

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

  // Notify buyer via email
  const buyerEmail = String(offer.buyerEmail || "").trim();
  if (buyerEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
    const cur = String(offer.currency || "USD");
    const itemTitle = String(offer.listingTitle || "");
    const listingId = String(offer.listingId || offer.productId || "");

    const subject = `Famous Finds — Counter Offer on "${itemTitle}"`;
    const text =
      `Hello,\n\n` +
      `The seller has responded to your offer on "${itemTitle}".\n\n` +
      `Your offer: ${cur} $${Number(offer.offerAmount).toLocaleString()}\n` +
      `Counter offer: ${cur} $${amount.toLocaleString()}\n\n` +
      `View the item and respond:\n${siteUrl}/product/${listingId}\n\n` +
      `Regards,\nThe Famous Finds Team`;

    const html =
      `<p>Hello,</p>` +
      `<p>The seller has responded to your offer on <b>"${itemTitle}"</b>.</p>` +
      `<div style="padding:14px;background:#fef3c7;border-radius:8px;margin:12px 0;">` +
      `<p style="margin:4px 0;"><b>Your offer:</b> ${cur} $${Number(offer.offerAmount).toLocaleString()}</p>` +
      `<p style="margin:4px 0;"><b>Counter offer:</b> ${cur} $${amount.toLocaleString()}</p>` +
      `</div>` +
      `<p><a href="${siteUrl}/product/${listingId}" ` +
      `style="display:inline-block;padding:12px 28px;background:#111827;color:#fff;` +
      `border-radius:999px;text-decoration:none;font-weight:600;">View Item</a></p>` +
      `<p>Regards,<br/>The Famous Finds Team</p>`;

    sendMail(buyerEmail, subject, text, html).catch((err) =>
      console.error("Failed to send counter-offer email:", err)
    );
  }

  return res.status(200).json({ ok: true });
}
