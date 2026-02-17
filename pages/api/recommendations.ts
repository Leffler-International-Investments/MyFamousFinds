// FILE: /pages/api/recommendations.ts
// Customer data utilization: personalized shopping recommendations
// Based on purchase history, saved items, and user preferences (ASOS-style)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
import { getAuthUser } from "../../utils/authServer";
import { getDeletedListingIds } from "../../lib/deletedListings";

type RecommendedItem = {
  id: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  reason: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    // 1. Load user preferences
    const prefDoc = await adminDb.collection("userPreferences").doc(authUser.uid).get();
    const prefs = prefDoc.exists ? (prefDoc.data() as any) : {};
    const userInterests: string[] = prefs.interests || [];
    const userSize = prefs.preferredSize || "";

    // 2. Load purchase history (brands and categories bought before)
    const ordersSnap = await adminDb
      .collection("orders")
      .where("buyerUid", "==", authUser.uid)
      .get();

    const purchasedBrands = new Set<string>();
    const purchasedCategories = new Set<string>();
    const purchasedListingIds = new Set<string>();

    ordersSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      if (d.listingBrand) purchasedBrands.add(d.listingBrand.toLowerCase());
      if (d.brand) purchasedBrands.add(d.brand.toLowerCase());
      if (d.category) purchasedCategories.add(d.category.toLowerCase());
      if (d.listingId) purchasedListingIds.add(d.listingId);
    });

    // 3. Load saved items for additional signal
    const savedSnap = await adminDb
      .collection("buyerSavedItems")
      .where("userId", "==", authUser.uid)
      .get();

    const savedListingIds = new Set<string>();
    savedSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      if (d.listingId) savedListingIds.add(d.listingId);
      if (d.brand) purchasedBrands.add(d.brand.toLowerCase());
    });

    // 4. Load soft-deleted listing IDs
    const deletedIds = await getDeletedListingIds();

    // 5. Load active listings and score them
    const listingsSnap = await adminDb
      .collection("listings")
      .where("status", "in", ["Live", "Active", "Approved"])
      .limit(200)
      .get();

    type ScoredItem = RecommendedItem & { score: number };
    const scored: ScoredItem[] = [];

    for (const doc of listingsSnap.docs) {
      const data = doc.data() as any;

      // Skip soft-deleted items
      if (deletedIds.has(doc.id)) continue;

      // Skip items already purchased or saved
      if (purchasedListingIds.has(doc.id) || savedListingIds.has(doc.id)) {
        continue;
      }

      // Skip sold items
      if (data.isSold || data.status === "Sold") continue;

      let score = 0;
      let reason = "Trending on Famous Finds";

      const brand = String(data.brand || data.designer || "").toLowerCase();
      const category = String(
        data.category || data.categoryLabel || ""
      ).toLowerCase();
      const size = String(data.size || "").toLowerCase();

      // Score based on brand match
      if (brand && purchasedBrands.has(brand)) {
        score += 5;
        reason = `Because you like ${data.brand || data.designer}`;
      }

      // Score based on category match
      if (category && purchasedCategories.has(category)) {
        score += 3;
        if (!reason.includes("Because")) {
          reason = `Based on your shopping history`;
        }
      }

      // Score based on interests
      for (const interest of userInterests) {
        const interestLower = interest.toLowerCase();
        if (
          category.includes(interestLower) ||
          String(data.title || "")
            .toLowerCase()
            .includes(interestLower)
        ) {
          score += 2;
          reason = `Matches your interest in ${interest}`;
          break;
        }
      }

      // Score based on size match
      if (userSize && size && size.includes(userSize.toLowerCase())) {
        score += 2;
      }

      // Popularity bonus
      score += Math.min((data.viewCount || 0) / 10, 3);

      if (score > 0) {
        const imageUrl = String(
          data.displayImageUrl ||
            data.display_image_url ||
            data.imageUrl ||
            data.image_url ||
            (Array.isArray(data.images) && data.images[0]) ||
            ""
        );

        scored.push({
          id: doc.id,
          title: data.title || "Untitled",
          brand: data.brand || data.designer || "",
          price: Number(data.price || data.priceUsd || 0),
          currency: data.currency || "USD",
          imageUrl,
          category: data.category || data.categoryLabel || "",
          reason,
          score,
        });
      }
    }

    // Sort by score and return top results
    scored.sort((a, b) => b.score - a.score);
    const recommendations: RecommendedItem[] = scored
      .slice(0, 12)
      .map(({ score, ...item }) => item);

    return res.status(200).json({ ok: true, recommendations });
  } catch (err: any) {
    console.error("recommendations error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
