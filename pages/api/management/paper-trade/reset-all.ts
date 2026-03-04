// Paper Trade: Reset ALL paper-trade orders and restore every listing to live.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  try {
    // Find all paper-trade orders
    const ordersSnap = await adminDb
      .collection("orders")
      .where("paperTrade", "==", true)
      .get();

    if (ordersSnap.empty) {
      return res.status(200).json({ ok: true, reset: 0, restored: 0, message: "No paper-trade orders found." });
    }

    let resetCount = 0;
    let restoredCount = 0;
    const errors: string[] = [];

    for (const doc of ordersSnap.docs) {
      const d: any = doc.data() || {};
      const orderId = doc.id;

      // Restore the listing to live
      const listingId = d.listingId;
      if (listingId) {
        try {
          const listingRef = adminDb.collection("listings").doc(listingId);
          const listingSnap = await listingRef.get();
          if (listingSnap.exists) {
            await listingRef.update({
              isSold: false,
              sold: false,
              status: "live",
              updatedAt: FieldValue.serverTimestamp(),
            });
            restoredCount++;
          }
        } catch (e: any) {
          errors.push(`Listing ${listingId}: ${e.message}`);
        }
      }

      // Delete the paper-trade order
      try {
        await doc.ref.delete();
        resetCount++;
      } catch (e: any) {
        errors.push(`Order ${orderId}: ${e.message}`);
      }
    }

    console.log(`[PAPER_TRADE_RESET_ALL] Reset ${resetCount} orders, restored ${restoredCount} listings`);

    return res.status(200).json({
      ok: true,
      reset: resetCount,
      restored: restoredCount,
      ...(errors.length ? { errors } : {}),
    });
  } catch (e: any) {
    console.error("[PAPER_TRADE_RESET_ALL]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
