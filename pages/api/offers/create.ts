// FILE: /pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";
import { sendSellerNewOfferEmail } from "../../../utils/email";

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

  // Email the seller about the new offer (non-blocking)
  if (sellerId) {
    try {
      // Look up seller email from sellers collection
      const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
      const sellerData: any = sellerDoc.exists ? sellerDoc.data() : {};
      const sellerEmail =
        sellerData?.email || sellerData?.contactEmail || sellerData?.contact_email || "";
      const sellerName = sellerData?.businessName || sellerData?.name || sellerData?.contactName || "";

      if (sellerEmail) {
        sendSellerNewOfferEmail({
          to: sellerEmail,
          sellerName,
          buyerEmail: String(buyerEmail || ""),
          itemTitle: listingTitle,
          offerAmount: resolved,
          listingPrice,
          currency,
          message: String(message || ""),
          offerId: ref.id,
        }).catch((err) => console.error("Failed to send offer email to seller:", err));
      }
    } catch (err) {
      console.error("Error looking up seller for offer email:", err);
    }
  }

  return res.status(201).json({ ok: true, offerId: ref.id });
}
