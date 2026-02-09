FILE: /pages/api/seller/orders.ts
// FILE: /pages/api/seller/orders.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

type OrderItem = {
  listingId?: string;
  title?: string;
  image?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: string;
  createdAt?: string | null;
  status: string;

  buyerName?: string;
  buyerEmail?: string;

  shippingAddress?: ShippingAddress | null;

  shipDeadlineAt?: string | null;

  shipping?: {
    status?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  } | null;

  fulfillment?: {
    stage?: string;
    signatureRequired?: boolean;
    shippedAt?: string | null;
    deliveredAt?: string | null;
  } | null;

  total?: number;
  currency?: string;

  items?: OrderItem[];
  listingTitle?: string;
};

type Data = { ok: true; orders: Order[] } | { ok: false; error: string };

function toIsoMaybe(ts: any): string | null {
  try {
    if (!ts) return null;
    if (typeof ts === "string") return ts;
    if (typeof ts?.toDate === "function") return ts.toDate().toISOString();
    if (ts instanceof Date) return ts.toISOString();
    const ms = typeof ts === "number" ? ts : Date.parse(String(ts));
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "firebase_not_configured" });
    }

    const snap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const orders: Order[] = snap.docs.map((d) => {
      const o: any = d.data() || {};

      const buyerName =
        o.buyerName || o.buyer?.name || o.customerName || o.customer_details?.name || "";

      const buyerEmail = o.buyerEmail || o.buyer?.email || o.customerEmail || "";

      const shippingAddress: ShippingAddress | null =
        o.shippingAddress || o.shipping || o.shipping?.address || o.shipping_details?.address || null;

      const shipDeadlineAt =
        toIsoMaybe(o.shipDeadlineAt) || toIsoMaybe(o.fulfillment?.shipDeadlineAt) || null;

      const fulfillment = o.fulfillment
        ? {
            stage: o.fulfillment.stage,
            signatureRequired: o.fulfillment.signatureRequired,
            shippedAt: toIsoMaybe(o.fulfillment.shippedAt),
            deliveredAt: toIsoMaybe(o.fulfillment.deliveredAt),
          }
        : null;

      const shipping = o.shipping
        ? {
            status: o.shipping.status,
            carrier: o.shipping.carrier,
            trackingNumber: o.shipping.trackingNumber,
            trackingUrl: o.shipping.trackingUrl,
          }
        : o.tracking
        ? {
            status: o.tracking.status,
            carrier: o.tracking.carrier,
            trackingNumber: o.tracking.trackingNumber,
            trackingUrl: o.tracking.trackingUrl,
          }
        : null;

      const total =
        typeof o.total === "number"
          ? o.total
          : typeof o.totals?.total === "number"
          ? o.totals.total
          : typeof o.amountTotal === "number"
          ? o.amountTotal
          : 0;

      const currency = String(o.currency || o.totals?.currency || "USD");

      const listingTitle =
        o.listingTitle || o.item || (Array.isArray(o.items) ? o.items[0]?.title : "") || "";

      return {
        id: d.id,
        createdAt: toIsoMaybe(o.createdAt),
        status: o.status || "paid",
        buyerName,
        buyerEmail,
        shippingAddress,
        shipDeadlineAt,
        shipping,
        fulfillment,
        total,
        currency,
        items: Array.isArray(o.items) ? o.items : [],
        listingTitle,
      };
    });

    return res.status(200).json({ ok: true, orders });
  } catch (e: any) {
    console.error("seller_orders_api_error", e);
    return res.status(500).json({ ok: false, error: e?.message || "internal_error" });
  }
}
