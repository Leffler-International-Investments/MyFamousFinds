// FILE: /pages/api/admin/featured-sellers.ts
// Performance-based featuring: calculate top sellers for homepage placement priority
// Metrics: number of items sold per month, seller rating, listing activity

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";

const MIN_ITEMS_PER_MONTH = 2; // Threshold for featured status

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count sold items per seller in last 30 days
    const ordersSnap = await adminDb.collection("orders").get();

    const sellerSales = new Map<string, number>();

    for (const doc of ordersSnap.docs) {
      const data = doc.data() as any;
      const createdAt = data.createdAt?.toMillis?.() || 0;
      if (createdAt < thirtyDaysAgo) continue;

      const sellerId = data.sellerId || "";
      if (!sellerId) continue;

      sellerSales.set(sellerId, (sellerSales.get(sellerId) || 0) + 1);
    }

    // Count active listings per seller
    const listingsSnap = await adminDb
      .collection("listings")
      .where("status", "in", ["Live", "Active", "Approved"])
      .get();

    const sellerListings = new Map<string, number>();
    for (const doc of listingsSnap.docs) {
      const data = doc.data() as any;
      const sellerId = data.sellerId || "";
      if (!sellerId) continue;
      sellerListings.set(sellerId, (sellerListings.get(sellerId) || 0) + 1);
    }

    // Calculate performance scores and determine featured sellers
    type SellerPerformance = {
      sellerId: string;
      salesLastMonth: number;
      activeListings: number;
      score: number;
      isFeatured: boolean;
    };

    const performances: SellerPerformance[] = [];
    const allSellerIds = new Set([
      ...sellerSales.keys(),
      ...sellerListings.keys(),
    ]);

    for (const sellerId of allSellerIds) {
      const sales = sellerSales.get(sellerId) || 0;
      const listings = sellerListings.get(sellerId) || 0;

      // Score = sales * 3 + active listings
      const score = sales * 3 + listings;
      const isFeatured = sales >= MIN_ITEMS_PER_MONTH;

      performances.push({
        sellerId,
        salesLastMonth: sales,
        activeListings: listings,
        score,
        isFeatured,
      });
    }

    // Sort by score descending
    performances.sort((a, b) => b.score - a.score);

    // Update featured status in Firestore
    const batch = adminDb.batch();
    const featuredSellers: string[] = [];

    for (const perf of performances) {
      const sellerRef = adminDb.collection("sellers").doc(perf.sellerId);

      batch.set(sellerRef, {
        performanceScore: perf.score,
        salesLastMonth: perf.salesLastMonth,
        activeListingCount: perf.activeListings,
        isFeatured: perf.isFeatured,
        performanceUpdatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (perf.isFeatured) {
        featuredSellers.push(perf.sellerId);
      }
    }

    // Save featured sellers list for homepage
    batch.set(
      adminDb.collection("cms").doc("featuredSellers"),
      {
        sellerIds: featuredSellers.slice(0, 20),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    return res.status(200).json({
      ok: true,
      totalSellers: performances.length,
      featuredCount: featuredSellers.length,
      topSellers: performances.slice(0, 10).map((p) => ({
        sellerId: p.sellerId,
        sales: p.salesLastMonth,
        listings: p.activeListings,
        score: p.score,
      })),
    });
  } catch (err: any) {
    console.error("admin/featured-sellers error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
