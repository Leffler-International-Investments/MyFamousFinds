// FILE: /pages/api/vip/update-points.ts
// VIP loyalty points engine — updates buyer points and tier after order completion.
// Called after order capture or via cron.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

const TIERS = [
  { name: "Member", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 5000 },
  { name: "Platinum", min: 15000 },
] as const;

function calculateTier(points: number): string {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) return TIERS[i].name;
  }
  return "Member";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const secret = req.headers["x-cron-secret"] || req.headers["x-admin-api-secret"];
  const expected = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!adminDb) return res.status(500).json({ error: "firebase_not_configured" });

  try {
    // Find completed orders not yet processed for VIP points
    const snap = await adminDb.collection("orders")
      .where("vipPointsAwarded", "==", false)
      .limit(100)
      .get();

    // Also check orders without the field (legacy)
    const snap2 = await adminDb.collection("orders")
      .where("status", "==", "paid")
      .limit(100)
      .get();

    const allDocs = new Map<string, any>();
    snap.docs.forEach((d) => allDocs.set(d.id, { ref: d.ref, data: d.data() }));
    snap2.docs.forEach((d) => {
      if (!allDocs.has(d.id) && !(d.data() as any).vipPointsAwarded) {
        allDocs.set(d.id, { ref: d.ref, data: d.data() });
      }
    });

    let processed = 0;

    for (const [orderId, { ref, data }] of allDocs) {
      const order: any = data || {};
      const buyerId = String(order.buyerId || "").trim();
      const buyerEmail = String(order.buyerEmail || "").trim();
      if (!buyerId && !buyerEmail) continue;

      // amountTotal is stored in cents
      const amountCents = Number(order.amountTotal || 0);
      const amountUsd = amountCents > 100 ? Math.round(amountCents / 100) : amountCents;
      if (amountUsd <= 0) continue;

      // 1 point per $1
      const pointsToAdd = amountUsd;

      // Find or create VIP member record
      const memberId = buyerId || buyerEmail;
      const memberRef = adminDb.collection("vip_members").doc(memberId);
      const memberSnap = await memberRef.get();

      if (memberSnap.exists) {
        const current: any = memberSnap.data() || {};
        const newPoints = (current.totalPoints || 0) + pointsToAdd;
        const newSpend = (current.lifetimeSpend || 0) + amountUsd;
        await memberRef.update({
          totalPoints: newPoints,
          lifetimeSpend: newSpend,
          tier: calculateTier(newPoints),
          lastPurchaseAt: Date.now(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await memberRef.set({
          memberId,
          email: buyerEmail,
          buyerId: buyerId || "",
          totalPoints: pointsToAdd,
          lifetimeSpend: amountUsd,
          tier: calculateTier(pointsToAdd),
          lastPurchaseAt: Date.now(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Mark order as processed
      await ref.update({ vipPointsAwarded: true });
      processed++;
    }

    return res.status(200).json({ ok: true, processed });
  } catch (err: any) {
    console.error("vip update-points error:", err);
    return res.status(500).json({ error: err?.message || "server_error" });
  }
}
