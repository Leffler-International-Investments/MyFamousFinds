// FILE: /pages/api/seller/orders.ts

import type { NextApiRequest, NextApiResponse } from "next";
// --- IMPORTANT: Make sure this path is correct ---
import { getSellerId } from "../../../utils/authServer";
import { adminDb } from "../../../utils/firebaseAdmin";

type OrderPayload = {
  id: string;
  item: string;
  buyer: string;
  total: string;
  status: string;
  createdAt?: string;
  shippingAddress?: any;
  shipping?: any;
  fulfillment?: any;
  payout?: any;
};

type OrdersResponse =
  | { ok: true; orders: OrderPayload[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrdersResponse>
) {
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const sellerId = await getSellerId(req);

    if (!sellerId) {
      return res.status(401).json({
        ok: false,
        error: "unauthorized",
      });
    }

    const snap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .get();

    const docs = snap.docs;

    const orders: OrderPayload[] = docs
      .map((doc) => {
        const data: any = doc.data() || {};

        const title: string =
          data.title || data.itemTitle || data.listingTitle || "Unknown item";

        const buyer: string =
          data.buyerName || data.buyerEmail || data.buyerId || "Private buyer";

        const rawTotal =
          data.total !== undefined && data.total !== null
            ? Number(data.total)
            : data.price !== undefined && data.price !== null
            ? Number(data.price)
            : 0;

        const status: string = data.status || data.orderStatus || "Pending";

        return {
          id: doc.id,
          item: title,
          buyer,
          total: `$${rawTotal.toFixed(2)}`,
          status,
          createdAt: data.createdAt?.toDate?.().toISOString?.() || undefined,
          shippingAddress: data.shippingAddress || null,
          shipping: data.shipping || null,
          fulfillment: data.fulfillment || null,
          payout: data.payout || null,
        };
      })
      .sort((a, b) => {
        const aDoc = docs.find((d) => d.id === a.id);
        const bDoc = docs.find((d) => d.id === b.id);
        const aCreated =
          (aDoc?.data() as any)?.createdAt?.toDate?.()?.getTime?.() || 0;
        const bCreated =
          (bDoc?.data() as any)?.createdAt?.toDate?.()?.getTime?.() || 0;
        return bCreated - aCreated;
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
