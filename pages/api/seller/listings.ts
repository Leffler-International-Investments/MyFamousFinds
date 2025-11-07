// FILE: /pages/api/seller/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Item = {
  id: string;
  title: string;
  price: number;
  status: string;
};

type ListingsResponse =
  | { ok: true; items: Item[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListingsResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const sellerId = getSellerId(req);
    if (!sellerId) {
      return res
        .status(401)
        .json({ ok: false, error: "unauthorized" });
    }

    // Old version used .orderBy("createdAt", "desc") together with
    // .where("sellerId", "==", sellerId), which requires a composite index
    // and caused FAILED_PRECONDITION errors.
    //
    // New version queries by sellerId only and sorts in memory.
    const snap = await adminDb
      .collection("listings")
      .where("sellerId", "==", sellerId)
      .limit(200)
      .get();

    // Sort newest first using createdAt if present
    const docs = [...snap.docs].sort((a, b) => {
      const ad: any = a.data() || {};
      const bd: any = b.data() || {};
      const aTs =
        ad.createdAt && typeof ad.createdAt.toMillis === "function"
          ? ad.createdAt.toMillis()
          : 0;
      const bTs =
        bd.createdAt && typeof bd.createdAt.toMillis === "function"
          ? bd.createdAt.toMillis()
          : 0;
      return bTs - aTs;
    });

    const items: Item[] = docs.map((doc) => {
      const data: any = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || "Untitled listing",
        price: Number(data.price || 0),
        status: data.status || "Draft",
      };
    });

    return res.status(200).json({ ok: true, items });
  } catch (err: any) {
    console.error("seller_listings_api_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
