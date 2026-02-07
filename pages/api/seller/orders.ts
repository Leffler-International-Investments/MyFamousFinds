// FILE: /pages/api/seller/orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import { adminDb } from "../../../utils/firebaseAdmin";

type OrderPayload = {
  id: string;
  listingTitle: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  currency: string;
  status: string;
  shipDeadlineAt?: string | null;
  shippingAddress?: any;
  fulfillment?: any;
  shipping?: any;
  payout?: any;
  createdAt?: string | null;
};

type OrdersResponse =
  | { ok: true; orders: OrderPayload[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrdersResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const sellerId = getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    const snap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .limit(200)
      .get();

    const orders = snap.docs
      .map((d) => {
        const o: any = d.data() || {};
        return {
          id: d.id,
          listingTitle: String(o.listingTitle || o.item || "Item"),
          buyerName: String(o.buyer?.name || ""),
          buyerEmail: String(o.buyer?.email || ""),
          total: Number(o.totals?.total || o.total || 0),
          currency: String(o.totals?.currency || o.currency || "USD"),
          status: String(o.status || "Pending"),
          shipDeadlineAt: o.shipDeadlineAt?.toDate?.()
            ? o.shipDeadlineAt.toDate().toISOString()
            : null,
          shippingAddress: o.shippingAddress || null,
          fulfillment: o.fulfillment || null,
          shipping: o.shipping || null,
          payout: o.payout || null,
          createdAt: o.createdAt?.toDate?.()
            ? o.createdAt.toDate().toISOString()
            : null,
        } as OrderPayload;
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return res.status(200).json({ ok: true, orders });
  } catch (err: any) {
    console.error("seller_orders_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
