// FILE: /pages/api/management/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        message:
          "Firebase Admin is not initialized. Check your Firebase Admin env vars in Vercel.",
      });
    }

    // Grab recent-ish listings (adjust as needed)
    // If some docs don't have createdAt, this orderBy can fail.
    // We keep it because it's the cleanest; if you have missing createdAt, tell me and I'll switch to a safe fallback.
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const rows = snap.docs.map((d) => {
      const x: any = d.data() || {};
      return {
        id: d.id,
        title: x.title ?? x.name ?? x.listingTitle ?? "",
        brand: x.brand ?? x.designer ?? "",
        condition: x.condition ?? "",
        sellerId: x.sellerId ?? x.seller ?? "",
        priceUsd:
          typeof x.priceUsd === "number"
            ? x.priceUsd
            : typeof x.price === "number"
            ? x.price
            : undefined,
        status: (x.status ?? x.moderationStatus ?? "").toString().toLowerCase() || "",
        category: (x.category ?? x.menuCategory ?? "").toString().toUpperCase() || "",
      };
    });

    return res.status(200).json({ rows });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
