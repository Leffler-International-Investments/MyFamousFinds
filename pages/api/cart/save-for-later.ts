// FILE: /pages/api/cart/save-for-later.ts
// Moves an item from cart to saved items (wishlist), or from saved to cart.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!isFirebaseAdminReady || !adminDb)
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });

  const userId = await getUserId(req);
  if (!userId)
    return res.status(401).json({ ok: false, error: "unauthorized" });

  const { listingId, action } = req.body || {};
  if (!listingId)
    return res.status(400).json({ ok: false, error: "missing_listing_id" });

  const docId = `${userId}_${listingId}`;

  try {
    if (action === "save") {
      // Move from cart to saved items
      const cartRef = adminDb.collection("buyerCartItems").doc(docId);
      const cartSnap = await cartRef.get();
      const cartData: any = cartSnap.exists ? cartSnap.data() : {};

      await adminDb.collection("buyerSavedItems").doc(docId).set(
        {
          userId,
          listingId: String(listingId),
          title: cartData.title || "",
          brand: cartData.brand || "",
          price: Number(cartData.price || 0),
          currency: cartData.currency || "USD",
          imageUrl: cartData.imageUrl || "",
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Remove from cart
      if (cartSnap.exists) {
        await cartRef.delete();
      }

      return res.status(200).json({ ok: true });
    }

    if (action === "move-to-cart") {
      // Move from saved items to cart
      const savedRef = adminDb.collection("buyerSavedItems").doc(docId);
      const savedSnap = await savedRef.get();
      const savedData: any = savedSnap.exists ? savedSnap.data() : {};

      await adminDb.collection("buyerCartItems").doc(docId).set(
        {
          userId,
          listingId: String(listingId),
          title: savedData.title || "",
          brand: savedData.brand || "",
          price: Number(savedData.price || 0),
          currency: savedData.currency || "USD",
          imageUrl: savedData.imageUrl || "",
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Remove from saved items
      if (savedSnap.exists) {
        await savedRef.delete();
      }

      return res.status(200).json({ ok: true });
    }

    if (action === "remove") {
      // Remove from cart
      await adminDb.collection("buyerCartItems").doc(docId).delete();
      return res.status(200).json({ ok: true });
    }

    if (action === "remove-saved") {
      // Remove from saved items (wishlist)
      await adminDb.collection("buyerSavedItems").doc(docId).delete();
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "invalid_action" });
  } catch (err) {
    console.error("[cart/save-for-later] Failed:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
