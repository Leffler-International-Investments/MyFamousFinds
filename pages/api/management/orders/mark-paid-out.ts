// FILE: /pages/api/management/orders/mark-paid-out.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";

type Ok = { ok: true };
type Err = { ok: false; error: string };

function isAdminRequest(req: NextApiRequest) {
  const required = process.env.ADMIN_API_SECRET;
  if (!required) return true;
  const got = String(req.headers["x-admin-secret"] || "");
  return got && got === required;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, payoutMethod, payoutReference } = (req.body || {}) as {
      orderId?: string;
      payoutMethod?: string;
      payoutReference?: string;
    };
    if (!orderId) return res.status(400).json({ ok: false, error: "missing_orderId" });

    const ref = adminDb.collection("orders").doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "order_not_found" });

    const o: any = snap.data() || {};

    // Must be signature confirmed first.
    const stage = String(o?.fulfillment?.stage || "");
    if (stage !== "SIGNATURE_CONFIRMED") {
      return res.status(400).json({ ok: false, error: "not_signature_confirmed" });
    }

    // Cooling must have elapsed (eligibleAt <= now)
    const eligibleAtTs = o?.payout?.eligibleAt;
    const eligibleAtMs = eligibleAtTs?.toDate?.()?.getTime?.() ?? 0;
    const nowMs = Date.now();
    if (eligibleAtMs && nowMs < eligibleAtMs) {
      return res.status(400).json({ ok: false, error: "cooling_not_elapsed" });
    }

    await ref.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        payout: {
          ...(o.payout || {}),
          status: "PAID",
          paidAt: FieldValue.serverTimestamp(),
          method: payoutMethod ? String(payoutMethod) : (o.payout?.method || "manual"),
          reference: payoutReference ? String(payoutReference) : (o.payout?.reference || ""),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("mark_paid_out_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
