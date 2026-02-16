// FILE: /pages/api/seller/offers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ error: "firebase_not_configured" });

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ error: "unauthorized" });

  console.log("[seller/offers] querying offers for sellerId:", sellerId);

  try {
    const snap = await adminDb
      .collection("offers")
      .where("sellerId", "==", sellerId)
      .limit(100)
      .get();

    const offers = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        listingTitle: String(d.listingTitle || "Untitled"),
        listingBrand: String(d.listingBrand || ""),
        buyerEmail: String(d.buyerEmail || ""),
        offerAmount: Number(d.offerAmount || d.offerPrice || 0),
        currency: String(d.currency || "USD"),
        message: String(d.message || ""),
        status: String(d.status || "pending"),
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        _ts: d.createdAt?.toDate?.().getTime() || 0,
      };
    });

    // Sort by createdAt descending in memory (avoids composite index requirement)
    offers.sort((a, b) => ((b as any)._ts || 0) - ((a as any)._ts || 0));
    offers.forEach((o: any) => delete o._ts);

    return res.status(200).json({ offers });
  } catch (err: any) {
    console.error("Error loading seller offers:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
