// FILE: /pages/api/orders/delete.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type Data = { ok: true } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const { orderId } = (req.body || {}) as { orderId?: string };

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ ok: false, error: "missing_order_id" });
    }

    const ref = adminDb.collection("orders").doc(orderId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    await ref.delete();

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("delete_order_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
