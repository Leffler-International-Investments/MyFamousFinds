// FILE: /pages/api/seller/orders.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Ok = { ok: true; orders: any[] };
type Err = { ok: false; error: string };

function toIso(v: any): string | null {
  if (!v) return null;
  try {
    if (typeof v === "string") return v;
    if (typeof v === "number") return new Date(v).toISOString();
    if (v?.toDate) return v.toDate().toISOString(); // Firestore Timestamp
    if (v instanceof Date) return v.toISOString();
    return null;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sellerId = getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, error: "firebase_admin_not_configured" });
  }

  try {
    let snap: any;

    // Prefer ordered query if possible
    try {
      snap = await adminDb
        .collection("orders")
        .where("sellerId", "==", sellerId)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
    } catch {
      // Fallback (in case of index/order issues)
      snap = await adminDb
        .collection("orders")
        .where("sellerId", "==", sellerId)
        .limit(200)
        .get();
    }

    const orders = snap.docs.map((doc: any) => {
      const d: any = doc.data() || {};

      const listingTitle = d.listingTitle || d.item || "";
      const buyerName = d.buyer?.name || "";
      const buyerEmail = d.buyer?.email || "";
      const total = Number(d.totals?.total ?? d.total ?? 0);
      const currency = String(d.totals?.currency ?? d.currency ?? "usd").toLowerCase();

      return {
        id: doc.id,

        // New fields used by your UI
        listingTitle,
        buyerName,
        buyerEmail,
        total,
        currency,
        status: String(d.status || "Paid"),

        createdAt: toIso(d.createdAt),
        shipDeadlineAt: toIso(d.shipDeadlineAt),

        shippingAddress: d.shippingAddress || null,
        shipping: d.shipping || null,
        fulfillment: d.fulfillment || null,

        // Backward compatibility fields (your UI still supports them)
        item: d.item || listingTitle,
        buyer: d.buyer?.email || d.buyerEmail || buyerEmail,
        totalLabel:
          typeof d.totalLabel === "string"
            ? d.totalLabel
            : currency
            ? `${currency.toUpperCase()} ${total.toFixed(2)}`
            : `${total.toFixed(2)}`,
      };
    });

    return res.status(200).json({ ok: true, orders });
  } catch (err: any) {
    console.error("seller_orders_api_error", err);
    return res
      .status(500)
      .json({ ok: false, error: String(err?.message || "server_error") });
  }
}
