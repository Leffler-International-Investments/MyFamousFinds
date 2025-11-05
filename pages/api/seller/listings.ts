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

    const snap = await adminDb
      .collection("listings")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const items: Item[] = snap.docs.map((doc) => {
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
