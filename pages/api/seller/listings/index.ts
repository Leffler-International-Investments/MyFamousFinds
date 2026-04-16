// FILE: /pages/api/seller/listings/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { getAuthUser, getSellerId } from "../../../../utils/authServer";

type Item = {
  id: string;
  title: string;
  price: number;
  status: string;
  purchase_proof: string;
  proof_doc_url: string;
  details: string;
  allowOffers?: boolean;
  rejectionReason?: string;
  imageUrl?: string;
  brand?: string;
};
type ListingsResponse =
  | { ok: true; items: Item[]; sellerId: string }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) {
    console.error("Firebase Admin is not configured – seller listings unavailable");
    return res.status(500).json({ ok: false, error: "Listings are temporarily unavailable. Please try again later." });
  }

  try {
    const authUser = await getAuthUser(req);
    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    // Some historical docs were saved with a non-canonical sellerId
    // (email/underscore-email/uid). Query all known aliases and merge.
    const sellerDoc = await adminDb.collection("sellers").doc(String(sellerId)).get();
    const sellerData: any = sellerDoc.data() || {};

    const aliases = new Set<string>([
      String(sellerId).trim(),
      String(authUser?.uid || "").trim(),
      String(authUser?.email || "").trim().toLowerCase(),
      String(sellerData.email || "").trim().toLowerCase(),
      String(sellerData.contactEmail || "").trim().toLowerCase(),
      String(sellerData.sellerId || "").trim(),
      String(sellerData.uid || "").trim(),
    ]);

    for (const alias of Array.from(aliases)) {
      if (alias && alias.includes("@")) aliases.add(alias.replace(/\./g, "_"));
    }

    const aliasList = Array.from(aliases).filter(Boolean);
    const chunks: string[][] = [];
    for (let i = 0; i < aliasList.length; i += 10) chunks.push(aliasList.slice(i, i + 10));

    const snaps = await Promise.all(
      chunks.map((ids) =>
        adminDb!
          .collection("listings")
          .where("sellerId", "in", ids)
          .limit(200)
          .get()
      )
    );

    const byId = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const s of snaps) {
      for (const d of s.docs) byId.set(d.id, d);
    }

    const docs = [...byId.values()].sort((a, b) => {
      const ad: any = a.data() || {};
      const bd: any = b.data() || {};
      const aTs = ad.createdAt?.toMillis ? ad.createdAt.toMillis() : 0;
      const bTs = bd.createdAt?.toMillis ? bd.createdAt.toMillis() : 0;
      return bTs - aTs;
    });

    const items: Item[] = docs.map((doc) => {
      const data: any = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || "Untitled listing",
        price: Number(data.price || 0),
        status: data.status || "Draft",
        purchase_proof: data.purchase_proof || "",
        proof_doc_url: data.proof_doc_url || "",
        details: data.details || "",
        allowOffers: data.allowOffers !== false,
        imageUrl: data.imageUrl || data.displayImageUrl ||
          (Array.isArray(data.images) && data.images.length > 0 ? String(data.images[0]) : "") ||
          (Array.isArray(data.imageUrls) && data.imageUrls.length > 0 ? String(data.imageUrls[0]) : "") || "",
        brand: data.brand || "",
        ...(data.rejectionReason ? { rejectionReason: String(data.rejectionReason) } : {}),
      };
    });

    return res.status(200).json({ ok: true, items, sellerId: String(sellerId) });
  } catch (err: any) {
    console.error("seller_listings_api_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
