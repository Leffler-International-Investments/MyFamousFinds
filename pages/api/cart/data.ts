// FILE: /pages/api/cart/data.ts
// Returns both cart items and saved items for the shopping bag page.
// Uses admin SDK to bypass Firestore security rules.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

type CartItem = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
};

type SavedItem = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
};

type Ok = { ok: true; cartItems: CartItem[]; savedItems: SavedItem[] };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "GET")
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!isFirebaseAdminReady || !adminDb)
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });

  const userId = await getUserId(req);
  if (!userId)
    return res.status(401).json({ ok: false, error: "unauthorized" });

  try {
    const [cartSnap, savedSnap] = await Promise.all([
      adminDb.collection("buyerCartItems").where("userId", "==", userId).get(),
      adminDb.collection("buyerSavedItems").where("userId", "==", userId).get(),
    ]);

    const cartItems: CartItem[] = cartSnap.docs.map((doc) => {
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
    });

    const savedItems: SavedItem[] = savedSnap.docs.map((doc) => {
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
    });

    return res.status(200).json({ ok: true, cartItems, savedItems });
  } catch (err) {
    console.error("[cart/data] Failed:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
