// FILE: /pages/api/management/user-bags.ts
// Management endpoint to view and remove items from any user's bags.
//
// GET  /api/management/user-bags?userId=<uid>
//   Returns cart items and saved items for the given user.
//
// POST /api/management/user-bags
//   Body: { userId, itemId, collection: "cart" | "saved" }
//   Removes the specified item from the user's cart or saved items.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type ItemRow = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_ready" });
  }

  if (!requireAdmin(req, res)) return;

  if (req.method === "GET") {
    const userId = String(req.query.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ ok: false, error: "missing_userId" });
    }

    try {
      const [cartSnap, savedSnap] = await Promise.all([
        adminDb.collection("buyerCartItems").where("userId", "==", userId).get(),
        adminDb.collection("buyerSavedItems").where("userId", "==", userId).get(),
      ]);

      const mapDoc = (doc: any): ItemRow => {
        const d: any = doc.data() || {};
        return {
          id: doc.id,
          listingId: d.listingId || "",
          title: d.title || "",
          brand: d.brand || "",
          price: Number(d.price || 0),
          currency: d.currency || "USD",
          imageUrl: d.imageUrl || "",
        };
      };

      return res.status(200).json({
        ok: true,
        cartItems: cartSnap.docs.map(mapDoc),
        savedItems: savedSnap.docs.map(mapDoc),
      });
    } catch (err) {
      console.error("[management/user-bags] GET failed:", err);
      return res.status(500).json({ ok: false, error: "internal_error" });
    }
  }

  if (req.method === "POST") {
    const { userId, itemId, collection: coll } = req.body || {};

    if (!userId || !itemId) {
      return res.status(400).json({ ok: false, error: "missing_userId_or_itemId" });
    }

    const collectionName =
      coll === "saved" ? "buyerSavedItems" : "buyerCartItems";

    try {
      const docRef = adminDb.collection(collectionName).doc(String(itemId));
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ ok: false, error: "item_not_found" });
      }

      // Verify the item belongs to the specified user
      const data: any = docSnap.data() || {};
      if (data.userId !== userId) {
        return res.status(403).json({ ok: false, error: "item_does_not_belong_to_user" });
      }

      await docRef.delete();
      return res.status(200).json({ ok: true, removed: true });
    } catch (err) {
      console.error("[management/user-bags] POST failed:", err);
      return res.status(500).json({ ok: false, error: "internal_error" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
