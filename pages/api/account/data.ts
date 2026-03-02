// FILE: /pages/api/account/data.ts
// Server-side endpoint that reads all account dashboard data using the
// admin SDK — bypasses Firestore security rules so reads always work.

import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { getAuthUser } from "../../../utils/authServer";

type ItemRow = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  status?: string;
  listingId?: string;
  imageUrl?: string;
};

type AccountData = {
  ok: true;
  savedItems: ItemRow[];
  cartItems: ItemRow[];
  offers: ItemRow[];
  purchases: ItemRow[];
  sellerListings: number;
  sellerSales: number;
  sellerOffers: number;
};

type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountData | Err>
) {
  if (req.method !== "GET")
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!isFirebaseAdminReady || !adminDb)
    return res.status(500).json({ ok: false, error: "firebase_not_ready" });

  const user = await getAuthUser(req);
  if (!user?.uid)
    return res.status(401).json({ ok: false, error: "unauthorized" });

  const uid = user.uid;
  const email = (user.email || "").trim().toLowerCase();

  try {
    // --- Saved items ---
    const savedSnap = await adminDb
      .collection("buyerSavedItems")
      .where("userId", "==", uid)
      .get();
    const savedItems: ItemRow[] = savedSnap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        title: data.title || "",
        brand: data.brand || "",
        price: data.price || 0,
        currency: data.currency || "USD",
        listingId: data.listingId || "",
        imageUrl: data.imageUrl || "",
      };
    });

    // --- Cart items ---
    const cartSnap = await adminDb
      .collection("buyerCartItems")
      .where("userId", "==", uid)
      .get();
    const cartItems: ItemRow[] = cartSnap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        title: data.title || "",
        brand: data.brand || "",
        price: data.price || 0,
        currency: data.currency || "USD",
        listingId: data.listingId || "",
        imageUrl: data.imageUrl || "",
      };
    });

    // --- Offers ---
    const offersSnap = await adminDb
      .collection("offers")
      .where("buyerId", "==", uid)
      .get();
    const offers: ItemRow[] = offersSnap.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        title: data.listingTitle || data.title || "Offer",
        brand: data.listingBrand || data.brand || "",
        price: data.offerAmount || data.offerPrice || data.price || 0,
        currency: data.currency || "USD",
        status: data.status || "pending",
        listingId: data.listingId || data.productId || "",
      };
    });

    // --- Purchases (orders) ---
    const seen = new Set<string>();
    const purchases: ItemRow[] = [];
    const pushOrder = (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
      if (seen.has(snap.id)) return;
      seen.add(snap.id);
      const d: any = snap.data();
      const amt =
        typeof d.amountTotal === "number"
          ? d.amountTotal / 100
          : d.total || d.amount || 0;
      purchases.push({
        id: snap.id,
        title: d.listingTitle || d.title || "Purchased item",
        brand: d.listingBrand || d.brand || "",
        price: amt,
        currency: d.currency || "USD",
      });
    };
    if (email) {
      const byEmail = await adminDb
        .collection("orders")
        .where("buyerEmail", "==", email)
        .get();
      byEmail.forEach(pushOrder);
      const byFormEmail = await adminDb
        .collection("orders")
        .where("buyerFormEmail", "==", email)
        .get();
      byFormEmail.forEach(pushOrder);
    }
    const byUid = await adminDb
      .collection("orders")
      .where("buyerId", "==", uid)
      .get();
    byUid.forEach(pushOrder);
    const byLegacy = await adminDb
      .collection("orders")
      .where("buyerUid", "==", uid)
      .get();
    byLegacy.forEach(pushOrder);

    // --- Seller activity stats ---
    let sellerListings = 0;
    let sellerSales = 0;
    let sellerOffers = 0;

    if (email) {
      const sellerId = email.replace(/\./g, "_");

      const listingsSnap = await adminDb
        .collection("listings")
        .where("sellerId", "==", sellerId)
        .get();
      sellerListings = listingsSnap.size;

      if (sellerListings === 0) {
        const bySellerEmail = await adminDb
          .collection("listings")
          .where("sellerEmail", "==", email)
          .get();
        sellerListings = bySellerEmail.size;
      }

      const salesSnap = await adminDb
        .collection("orders")
        .where("sellerEmail", "==", email)
        .get();
      sellerSales = salesSnap.size;

      const sellerOffersSnap = await adminDb
        .collection("offers")
        .where("sellerId", "==", sellerId)
        .get();
      sellerOffers = sellerOffersSnap.size;

      // Also check offers where sellerId is stored as the raw email
      if (sellerId !== email) {
        const offersByEmail = await adminDb
          .collection("offers")
          .where("sellerId", "==", email)
          .get();
        // Deduplicate by collecting IDs we already counted
        const seen = new Set(sellerOffersSnap.docs.map((d) => d.id));
        for (const d of offersByEmail.docs) {
          if (!seen.has(d.id)) sellerOffers++;
        }
      }

      // Also check offers stored with sellerEmail field
      const offersBySellerEmail = await adminDb
        .collection("offers")
        .where("sellerEmail", "==", email)
        .get();
      if (offersBySellerEmail.size > 0) {
        const seen = new Set(sellerOffersSnap.docs.map((d) => d.id));
        for (const d of offersBySellerEmail.docs) {
          if (!seen.has(d.id)) sellerOffers++;
        }
      }
    }

    return res.status(200).json({
      ok: true,
      savedItems,
      cartItems,
      offers,
      purchases,
      sellerListings,
      sellerSales,
      sellerOffers,
    });
  } catch (err) {
    console.error("[account/data] Failed:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
