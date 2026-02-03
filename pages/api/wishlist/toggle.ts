// FILE: /pages/api/wishlist/toggle.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({
      ok: false,
      error:
        "Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY) in Vercel env vars.",
    });
  }

  const { productId, on } = req.body || {};
  if (!productId) return res.status(400).json({ ok:false, error:"missing_product_id" });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ ok:false, error:"missing_user_id" });

  const docId = `${userId}_${productId}`;
  const ref = adminDb.collection("buyerSavedItems").doc(docId);

  if (!on) {
    await ref.delete();
    return res.status(200).json({ ok:true, removed: true });
  }

  const listingSnap = await adminDb.collection("listings").doc(String(productId)).get();
  if (!listingSnap.exists) {
    return res.status(404).json({ ok:false, error:"listing_not_found" });
  }
  const listing = listingSnap.data() || {};

  await ref.set(
    {
      userId,
      listingId: String(productId),
      title: String(listing.title || listing.name || ""),
      brand: String(listing.brand || listing.designer || ""),
      price: Number(listing.price || 0),
      currency: String(listing.currency || "USD"),
      imageUrl: String(
        listing.displayImageUrl ||
          listing.display_image_url ||
          listing.imageUrl ||
          listing.image_url ||
          ""
      ),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return res.status(200).json({ ok:true });
}
