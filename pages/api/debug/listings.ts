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
    const soldCounts = { isSold: 0, sold: 0, neither: 0 };
    const samples: any[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      const status = String(d.status || "(empty)").trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (d.isSold === true) soldCounts.isSold++;
      if (d.sold === true) soldCounts.sold++;
      if (d.isSold !== true && d.sold !== true) soldCounts.neither++;

      // Collect first 5 samples with key fields
      if (samples.length < 10) {
        samples.push({
          id: doc.id,
          title: d.title || d.name || "(no title)",
          status: d.status ?? "(undefined)",
          isSold: d.isSold ?? "(undefined)",
          sold: d.sold ?? "(undefined)",
          category: d.category || d.categoryLabel || "(none)",
          brand: d.brand || d.designer || "(none)",
          hasCreatedAt: !!d.createdAt,
          hasImage: !!(
            d.displayImageUrl ||
            d.imageUrl ||
            d.image ||
            (Array.isArray(d.images) && d.images.length > 0) ||
            (Array.isArray(d.displayImageUrls) && d.displayImageUrls.length > 0)
          ),
        });
      }
    });

    return res.status(200).json({
      totalDocuments: snap.size,
      statusBreakdown: statusCounts,
      soldBreakdown: soldCounts,
      sampleDocuments: samples,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Unknown error",
    });
  }
}
