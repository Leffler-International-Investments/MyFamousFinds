// Paper Trade: Reset / delete a paper-trade order and restore the listing.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const orderRef = adminDb.collection("orders").doc(String(orderId));
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const d: any = orderSnap.data() || {};

    if (!d.paperTrade) {
      return res.status(400).json({ error: "Only paper-trade orders can be reset" });
    }

    // Restore listing to live
    const listingId = d.listingId;
    if (listingId) {
      try {
        await adminDb.collection("listings").doc(listingId).update({
          isSold: false,
          sold: false,
          status: "live",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("[PAPER_TRADE_RESET] Could not restore listing:", e?.message);
      }
    }

    // Delete the paper-trade order
    await orderRef.delete();

    return res.status(200).json({ ok: true, restoredListingId: listingId || null });
  } catch (e: any) {
    console.error("[PAPER_TRADE_RESET]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
