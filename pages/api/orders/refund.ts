// FILE: pages/api/orders/refund.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  try {
    const { orderId, reason } = req.body || {};

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ ok: false, error: "missing_order_id" });
    }

    const ref = adminDb.collection("orders").doc(orderId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const now = new Date().toISOString();

    await ref.set(
      {
        status: "Refunded",
        refund: {
          status: "Refunded",
          reason: reason || "",
          refundedAt: now,
        },
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("refund_api_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
