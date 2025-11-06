// FILE: /pages/api/seller/orders.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import { adminDb } from "../../../utils/firebaseAdmin";

type OrderPayload = {
  id: string;
  item: string;
  buyer: string;
  total: string;
  status: string;
};

type OrdersResponse =
  | { ok: true; orders: OrderPayload[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrdersResponse>
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

    // Load latest orders for this seller from Firestore
    const snap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const orders: OrderPayload[] = snap.docs.map((doc) => {
      const data: any = doc.data() || {};
      const gross =
        data.totalGross ??
        data.total ??
        data.price ??
        0;

      return {
        id: doc.id,
        item:
          data.listingTitle ||
          data.title ||
          "Unknown item",
        buyer: data.buyerName || "Private buyer",
        total: `$${Number(gross).toFixed(2)}`,
        status: data.status || "Pending",
      };
    });

    return res.status(200).json({ ok: true, orders });
  } catch (err: any) {
    console.error("seller_orders_error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "server_error",
    });
  }
}
