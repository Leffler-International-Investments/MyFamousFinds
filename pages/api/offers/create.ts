// FILE: /pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

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

  const ref = await adminDb.collection("offers").add({
    listingId: String(productId),
    productId: String(productId),
    sellerId,
    buyerId: String(buyerId),
    buyerEmail: String(buyerEmail || ""),
    listingTitle: String(L.title || L.name || ""),
    listingBrand: String(L.brand || L.designer || ""),
    offerAmount: resolved,
    offerPrice: resolved,
    currency: String(L.currency || "USD"),
    message: String(message || ""),
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return res.status(201).json({ ok: true, offerId: ref.id });
}
