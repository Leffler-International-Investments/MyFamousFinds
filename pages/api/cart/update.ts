// FILE: /pages/api/cart/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

type Ok = { ok: true; removed?: true };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  const { productId, add } = req.body || {};
  if (!productId) return res.status(400).json({ ok: false, error: "missing_product_id" });

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const docId = `${userId}_${productId}`;
  const ref = adminDb.collection("buyerCartItems").doc(docId);

  if (!add) {
    await ref.delete();
    return res.status(200).json({ ok: true, removed: true });
  }

  const listingSnap = await adminDb.collection("listings").doc(String(productId)).get();
  if (!listingSnap.exists) return res.status(404).json({ ok: false, error: "listing_not_found" });

  const listing: any = listingSnap.data() || {};

  if (listing.isSold || listing.status === "sold") {
    return res.status(400).json({ ok: false, error: "listing_sold" });
  }

  const imageUrl = String(
    listing.displayImageUrl ||
      listing.display_image_url ||
      listing.imageUrl ||
      listing.image_url ||
      ""
  );

  await ref.set(
    {
      userId: String(userId),
      listingId: String(productId),
      title: String(listing.title || listing.name || ""),
      brand: String(listing.brand || listing.designer || ""),
      price: Number(listing.price || listing.priceUsd || 0),
      currency: String(listing.currency || "USD"),
      imageUrl,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return res.status(200).json({ ok: true });
}
