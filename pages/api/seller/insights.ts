// FILE: /pages/api/seller/insights.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Ok = { ok: true; items: any[] };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const snap = await adminDb
    .collection("orders")
    .where("sellerId", "==", String(sellerId))
    .where("createdAt", ">=", since)
    .get();

  const map = new Map<string, { sum: number; count: number; first: Date; last: Date }>();
  snap.forEach((doc) => {
    const d: any = doc.data() || {};
    const brand = String(d.brand || "Unknown");
    const price = Number(d.price || 0) * Number(d.qty || 1);
    const createdAt: Date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
    const rec = map.get(brand) || { sum: 0, count: 0, first: createdAt, last: createdAt };
    rec.sum += price;
    rec.count += 1;
    if (createdAt < rec.first) rec.first = createdAt;
    if (createdAt > rec.last) rec.last = createdAt;
    map.set(brand, rec);
  });

  const items = Array.from(map.entries())
    .map(([brand, v]) => {
      const days = Math.max(1, (v.last.getTime() - v.first.getTime()) / (24 * 3600 * 1000));
      return {
        brand,
        avgPrice: v.count ? v.sum / v.count : 0,
        sellThrough: Math.min(1, v.count / (v.count + 3)),
        timeToSellDays: Math.round(days / Math.max(1, v.count)),
        volume: v.count,
      };
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 12);

  return res.status(200).json({ ok: true, items });
}
