// FILE: /pages/api/cron/price-drop-alerts.ts
// Checks for recent price drops on wishlisted items and emails buyers.
// Intended to be called by a cron job or scheduled task.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { sendWishlistPriceDropEmail } from "../../../utils/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const secret = req.headers["x-cron-secret"] || req.headers["x-admin-api-secret"];
  const expected = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!adminDb) return res.status(500).json({ error: "firebase_not_configured" });

  try {
    // Find listings that had a price drop in the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const listingsSnap = await adminDb.collection("listings")
      .where("priceDroppedAt", ">=", oneDayAgo)
      .limit(100)
      .get();

    let sent = 0;

    for (const listingDoc of listingsSnap.docs) {
      const listing: any = listingDoc.data() || {};
      const oldPrice = Number(listing.previousPrice || 0);
      const newPrice = Number(listing.priceUsd || listing.price || 0);
      if (!oldPrice || !newPrice || newPrice >= oldPrice) continue;

      // Find all buyers who wishlisted this item
      const wishSnap = await adminDb.collection("buyerSavedItems")
        .where("listingId", "==", listingDoc.id)
        .limit(200)
        .get();

      for (const wishDoc of wishSnap.docs) {
        const wish: any = wishDoc.data() || {};
        const userId = String(wish.userId || "").trim();
        if (!userId) continue;

        // Get buyer email from auth or user doc
        let buyerEmail = "";
        try {
          const userDoc = await adminDb.collection("users").doc(userId).get();
          buyerEmail = String((userDoc.data() as any)?.email || "").trim();
        } catch { /* skip */ }

        if (!buyerEmail) continue;

        try {
          await sendWishlistPriceDropEmail({
            to: buyerEmail,
            itemTitle: listing.title || "Item",
            oldPrice,
            newPrice,
            currency: listing.currency || "USD",
            listingId: listingDoc.id,
          });
          sent++;
        } catch (err) {
          console.error(`Price drop alert failed for ${buyerEmail}:`, err);
        }
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err: any) {
    console.error("price-drop-alerts cron error:", err);
    return res.status(500).json({ error: err?.message || "server_error" });
  }
}
