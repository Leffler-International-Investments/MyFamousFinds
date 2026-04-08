// FILE: /pages/api/management/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        message:
          "Firebase Admin is not initialized. Check your Firebase Admin env vars in Vercel.",
      });
    }

    if (!requireAdmin(req, res)) {
      return;
    }

    // Don't use orderBy("createdAt") — Firestore silently excludes docs missing that field
    const snap = await adminDb.collection("listings").get();

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
