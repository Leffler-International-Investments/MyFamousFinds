FILE: /pages/api/shipping/update-tracking.ts
// FILE: /pages/api/shipping/update-tracking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { orderId, carrier, tracking } = req.body || {};
  if (!orderId || !carrier || !tracking) return res.status(400).json({ ok: false, error: "missing_fields" });

  const ref = adminDb.collection("orders").doc(String(orderId));
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ ok: false, error: "order_not_found" });
  const O = snap.data()!;
  if (String(O.sellerId) !== sellerId) return res.status(403).json({ ok: false, error: "forbidden" });

  await ref.set(
    {
      shipping: {
        carrier: String(carrier),
        tracking: String(tracking),
        updatedAt: FieldValue.serverTimestamp(),
      },
      status: "SHIPPED",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return res.status(200).json({ ok: true });
}
