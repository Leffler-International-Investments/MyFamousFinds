// FILE: /pages/api/cron/wishlist-price-alerts.ts
// Cron endpoint: checks wishlisted items for price drops and emails buyers.
// Call via Vercel Cron or external scheduler (e.g. daily).
// Secured by CRON_SECRET env var.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendWishlistPriceDropEmail } from "../../../utils/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Verify cron secret
  const secret = req.headers["authorization"]?.replace("Bearer ", "") || "";
  const expected = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_ready" });
  }

  try {
    // Fetch all wishlist items that have a savedPrice recorded
    const savedSnap = await adminDb.collection("buyerSavedItems").limit(500).get();

    if (savedSnap.empty) {
      return res.status(200).json({ ok: true, checked: 0, alerted: 0 });
    }

    let checked = 0;
    let alerted = 0;

    // Group by listingId to avoid duplicate listing lookups
    const byListing = new Map<string, Array<{ docId: string; userId: string; savedPrice: number }>>();
    for (const doc of savedSnap.docs) {
      const data = doc.data() as any;
      const listingId = String(data.listingId || "");
      const savedPrice = Number(data.savedPrice || data.price || 0);
      const userId = String(data.userId || "");
      if (!listingId || !userId || !savedPrice) continue;

      if (!byListing.has(listingId)) byListing.set(listingId, []);
      byListing.get(listingId)!.push({ docId: doc.id, userId, savedPrice });
    }

    // Check each listing's current price
    for (const [listingId, watchers] of byListing.entries()) {
      checked++;
      let listingDoc;
      try {
        listingDoc = await adminDb.collection("listings").doc(listingId).get();
      } catch {
        continue;
      }
      if (!listingDoc.exists) continue;

      const listing = listingDoc.data() as any;
      const currentPrice = Number(listing.priceUsd || listing.price || 0);
      const title = String(listing.title || listing.name || "Untitled");
      const currency = String(listing.currency || "USD");

      if (!currentPrice) continue;

      for (const watcher of watchers) {
        // Only alert if price dropped by at least 1%
        if (currentPrice >= watcher.savedPrice) continue;
        const dropPercent = ((watcher.savedPrice - currentPrice) / watcher.savedPrice) * 100;
        if (dropPercent < 1) continue;

        // Lookup buyer email from Firebase Auth
        let buyerEmail = "";
        let buyerName = "";
        try {
          const admin = await import("firebase-admin");
          const userRecord = await admin.auth().getUser(watcher.userId);
          buyerEmail = userRecord.email || "";
          buyerName = userRecord.displayName || "";
        } catch {
          continue; // Skip if we can't find the user
        }

        if (!buyerEmail) continue;

        // Send price drop email
        try {
          await sendWishlistPriceDropEmail({
            to: buyerEmail,
            buyerName,
            itemTitle: title,
            oldPrice: watcher.savedPrice,
            newPrice: currentPrice,
            currency,
            listingId,
          });

          // Update the savedPrice so we don't re-alert
          await adminDb.collection("buyerSavedItems").doc(watcher.docId).update({
            savedPrice: currentPrice,
            lastPriceAlertAt: FieldValue.serverTimestamp(),
          });

          alerted++;
        } catch (err) {
          console.error(`[wishlist-price-alerts] Failed to send alert for ${listingId}:`, err);
        }
      }
    }

    return res.status(200).json({ ok: true, checked, alerted });
  } catch (err) {
    console.error("[wishlist-price-alerts] Error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
