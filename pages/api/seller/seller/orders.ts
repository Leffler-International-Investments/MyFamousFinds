// FILE: /pages/api/seller/orders.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import { adminDb } from "../../../utils/firebaseAdmin";

type OrderPayload = {
  id: string;
  title: string;
  buyerName: string;
  price: number;
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

    // Read latest 100 orders for this seller
    const snap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const orders: OrderPayload[] = snap.docs.map((doc) => {
      const data: any = doc.data() || {};
      return {
        id: doc.id,
        title:
          data.listingTitle ||
          data.title ||
          "Unknown item",
        buyerName: data.buyerName || "Private buyer",
        price: Number(data.totalGross ?? data.price ?? 0),
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
