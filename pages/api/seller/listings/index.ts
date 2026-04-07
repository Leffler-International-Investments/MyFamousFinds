// FILE: /pages/api/seller/listings/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";

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
type ListingsResponse = { ok: true; items: Item[] } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    const snap = await adminDb
      .collection("listings")
      .where("sellerId", "==", String(sellerId))
      .limit(200)
      .get();

    const docs = [...snap.docs].sort((a, b) => {
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

    return res.status(200).json({ ok: true, items });
  } catch (err: any) {
    console.error("seller_listings_api_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
