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

type BuyerProfile = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Ok = {
  ok: true;
  cartItems: CartItem[];
  savedItems: SavedItem[];
  buyerProfile: BuyerProfile | null;
};
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
    const [cartSnap, savedSnap, userSnap] = await Promise.all([
      adminDb.collection("buyerCartItems").where("userId", "==", userId).get(),
      adminDb.collection("buyerSavedItems").where("userId", "==", userId).get(),
      adminDb.collection("users").doc(userId).get(),
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

    const userData: any = userSnap.exists ? userSnap.data() || {} : {};
    const shipping = userData.shippingAddress || userData.checkoutAddress || {};

    const buyerProfile: BuyerProfile | null = {
      fullName: String(userData.fullName || "").trim(),
      email: String(userData.email || "").trim(),
      phone: String(userData.phone || "").trim(),
      addressLine1: String(shipping.addressLine1 || shipping.line1 || "").trim(),
      addressLine2: String(shipping.addressLine2 || shipping.line2 || "").trim(),
      city: String(shipping.city || "").trim(),
      state: String(shipping.state || "").trim(),
      postalCode: String(shipping.postalCode || shipping.zip || "").trim(),
      country: String(shipping.country || "US").trim(),
    };

    const hasProfileData = Object.values(buyerProfile).some((v) => Boolean(String(v).trim()));

    return res.status(200).json({
      ok: true,
      cartItems,
      savedItems,
      buyerProfile: hasProfileData ? buyerProfile : null,
    });
  } catch (err) {
    console.error("[cart/data] Failed:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
