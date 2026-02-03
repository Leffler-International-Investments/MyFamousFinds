// FILE: /pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const buyerId = getUserId(req);
  const { productId, price, offerValue, offerAmount, buyerEmail, message } = req.body || {};
  const resolvedPrice = price ?? offerValue ?? offerAmount;
  if (!productId || !resolvedPrice) return res.status(400).json({ ok:false, error:"missing_fields" });

  // Read listing → get sellerId & title
  const listing = await adminDb.collection("listings").doc(String(productId)).get();
  if (!listing.exists) return res.status(404).json({ ok:false, error:"listing_not_found" });
  const L = listing.data()!;
  const sellerId = String(L.sellerId || "unknown");

  const ref = await adminDb.collection("offers").add({
    listingId: String(productId),
    productId: String(productId),
    sellerId,
    buyerId,
    buyerEmail: String(buyerEmail || ""),
    listingTitle: String(L.title || L.name || ""),
    listingBrand: String(L.brand || L.designer || ""),
    offerAmount: Number(resolvedPrice),
    offerPrice: Number(resolvedPrice),
    currency: String(L.currency || "USD"),
    message: String(message||""),
    status: "pending", // pending | accepted | rejected | expired
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return res.status(201).json({ ok:true, offerId: ref.id });
}
