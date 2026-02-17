// FILE: /pages/api/cron/review-requests.ts
// Sends review request emails to buyers 7 days after order was marked "delivered".
// Intended to be called by a cron job or scheduled task.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { sendReviewRequestEmail } from "../../../utils/email";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // Simple auth: check for cron secret or admin API key
  const secret = req.headers["x-cron-secret"] || req.headers["x-admin-api-secret"];
  const expected = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!adminDb) return res.status(500).json({ error: "firebase_not_configured" });

  try {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const snap = await adminDb.collection("orders")
      .where("status", "==", "delivered")
      .where("reviewRequestSent", "==", false)
      .limit(50)
      .get();

    let sent = 0;

    for (const doc of snap.docs) {
      const order: any = doc.data() || {};
      const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt || 0;
      const ts = typeof deliveredAt === "number" ? deliveredAt : deliveredAt?.toMillis?.() || 0;

      if (ts > cutoff) continue; // Not yet 7 days

      const buyerEmail = String(order.buyerEmail || "").trim();
      if (!buyerEmail) continue;

      try {
        await sendReviewRequestEmail({
          to: buyerEmail,
          buyerName: order.buyerName || undefined,
          itemTitle: order.listingTitle || "your item",
          orderId: doc.id,
        });

        await adminDb.collection("orders").doc(doc.id).update({
          reviewRequestSent: true,
          reviewRequestSentAt: Date.now(),
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send review request for order ${doc.id}:`, err);
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err: any) {
    console.error("review-requests cron error:", err);
    return res.status(500).json({ error: err?.message || "server_error" });
  }
}
