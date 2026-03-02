// FILE: /pages/api/seller/offers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId, getAuthUser } from "../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ error: "firebase_not_configured" });

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ error: "unauthorized" });

  const user = await getAuthUser(req);
  const email = (user?.email || "").trim().toLowerCase();
  const underscoreId = email ? email.replace(/\./g, "_") : "";

  console.log("[seller/offers] querying offers for sellerId:", sellerId);

  try {
    // Query by the primary sellerId
    const snap = await adminDb
      .collection("offers")
      .where("sellerId", "==", sellerId)
      .limit(100)
      .get();

    const seen = new Set<string>();
    const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    for (const doc of snap.docs) {
      seen.add(doc.id);
      allDocs.push(doc);
    }

    // Also query alternate sellerId formats to catch mismatches
    const alternateIds = new Set([email, underscoreId]);
    alternateIds.delete(sellerId); // skip the one we already queried
    alternateIds.delete(""); // remove empty
    for (const altId of alternateIds) {
      const altSnap = await adminDb
        .collection("offers")
        .where("sellerId", "==", altId)
        .limit(100)
        .get();
      for (const doc of altSnap.docs) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          allDocs.push(doc);
        }
      }
    }

    const offers = allDocs.map((doc) => {
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
