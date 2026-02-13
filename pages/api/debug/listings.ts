// FILE: /pages/api/debug/listings.ts
// Diagnostic endpoint: visit /api/debug/listings to see what's in Firestore

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  if (!adminDb) {
    return res.status(500).json({ error: "adminDb not initialized — check FIREBASE_SERVICE_ACCOUNT_JSON" });
  }

  try {
    const snap = await adminDb.collection("listings").get();

    const statusCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const soldInfo = { isSoldTrue: 0, soldTrue: 0, notSold: 0 };
    const allItems: any[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      const status = String(d.status || "(no status)").trim();
      const category = String(d.category || d.categoryLabel || d.menuCategory || "(no category)").trim();

      statusCounts[status] = (statusCounts[status] || 0) + 1;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      if (d.isSold === true) soldInfo.isSoldTrue++;
      if (d.sold === true) soldInfo.soldTrue++;
      if (d.isSold !== true && d.sold !== true && !String(d.status || "").toLowerCase().includes("sold")) {
        soldInfo.notSold++;
      }

      allItems.push({
        id: doc.id,
        title: d.title || d.name || "(no title)",
        status: d.status ?? "(undefined)",
        isSold: d.isSold ?? "(undefined)",
        sold: d.sold ?? "(undefined)",
        category: category,
        brand: d.brand || d.designer || "(none)",
        price: d.price ?? d.priceUsd ?? "(none)",
        hasCreatedAt: d.createdAt !== undefined,
        createdAtType: d.createdAt === undefined ? "missing" : typeof d.createdAt === "object" ? "Timestamp/Date" : typeof d.createdAt,
        hasImage: !!(
          d.displayImageUrl ||
          d.imageUrl ||
          d.image_url ||
          d.image ||
          (Array.isArray(d.images) && d.images.length > 0) ||
          (Array.isArray(d.displayImageUrls) && d.displayImageUrls.length > 0) ||
          (Array.isArray(d.imageUrls) && d.imageUrls.length > 0) ||
          (Array.isArray(d.photos) && d.photos.length > 0)
        ),
      });
    });

    return res.status(200).json({
      totalDocuments: snap.size,
      statusBreakdown: statusCounts,
      categoryBreakdown: categoryCounts,
      soldBreakdown: soldInfo,
      wouldShowOnHomepage: soldInfo.notSold,
      allDocuments: allItems,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Unknown error",
      stack: err.stack || "",
    });
  }
}
