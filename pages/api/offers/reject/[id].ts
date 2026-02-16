// FILE: /pages/api/offers/reject/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";
import { isAdminRequest } from "../../../../utils/adminAuth";
import { sendBuyerOfferRejectedEmail } from "../../../../utils/email";

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

  // Notify buyer via email (non-blocking)
  const buyerEmail = String(offer.buyerEmail || "").trim();
  if (buyerEmail) {
    sendBuyerOfferRejectedEmail({
      to: buyerEmail,
      itemTitle: String(offer.listingTitle || ""),
      offerAmount: Number(offer.offerAmount || 0),
      currency: String(offer.currency || "USD"),
      reason,
    }).catch((err) => console.error("Failed to send offer rejected email:", err));
  }

  return res.status(200).json({ ok: true });
}
