// FILE: /pages/api/shipping/update-tracking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, carrier, tracking, trackingNumber } = (req.body || {}) as {
      orderId?: string;
      carrier?: string;
      tracking?: string;
      trackingNumber?: string;
    };

    const tn = String(trackingNumber || tracking || "").trim();
    const car = String(carrier || "").trim();

    if (!orderId || !car || !tn) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const ref = adminDb.collection("orders").doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const o: any = snap.data() || {};
    if (String(o.sellerId || "") !== String(sellerId)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    await ref.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        shipping: {
          ...(o.shipping || {}),
          carrier: car,
          trackingNumber: tn,
          status: o.shipping?.status || "shipped",
          updatedAt: FieldValue.serverTimestamp(),
        },
        tracking: {
          ...(o.tracking || {}),
          carrier: car,
          trackingNumber: tn,
          status: o.tracking?.status || "shipped",
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("update_tracking_error", e);
    return res.status(500).json({ ok: false, error: e?.message || "server_error" });
  }
}
