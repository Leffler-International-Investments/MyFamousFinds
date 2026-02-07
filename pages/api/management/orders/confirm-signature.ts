// FILE: /pages/api/management/orders/confirm-signature.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../../lib/payoutSettings";

type Ok = { ok: true; eligibleAt: string };
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
    const { orderId, coolingDays } = (req.body || {}) as {
      orderId?: string;
      coolingDays?: number;
    };
    if (!orderId) {
      return res.status(400).json({ ok: false, error: "missing_orderId" });
    }

    const ref = adminDb.collection("orders").doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const o: any = snap.data() || {};
    const { defaultCoolingDays } = await getPayoutSettings();
    const effectiveCoolingDays = (() => {
      const fromBody = Number(coolingDays);
      if (Number.isFinite(fromBody) && fromBody >= 0 && fromBody <= 60) return Math.round(fromBody);
      const fromOrder = Number(o?.payout?.coolingDays);
      if (Number.isFinite(fromOrder) && fromOrder >= 0 && fromOrder <= 60) return Math.round(fromOrder);
      return defaultCoolingDays;
    })();

    const now = new Date();
    const eligibleAt = new Date(now.getTime() + effectiveCoolingDays * 24 * 60 * 60 * 1000);

    await ref.set(
      {
        status: "Completed",
        updatedAt: FieldValue.serverTimestamp(),
        fulfillment: {
          ...(o.fulfillment || {}),
          stage: "SIGNATURE_CONFIRMED",
          deliveredAt: o.fulfillment?.deliveredAt || FieldValue.serverTimestamp(),
          signatureRequired: o.fulfillment?.signatureRequired !== false,
          signatureConfirmedAt: FieldValue.serverTimestamp(),
        },
        payout: {
          ...(o.payout || {}),
          coolingDays: effectiveCoolingDays,
          status: "COOLING",
          eligibleAt,
          signatureConfirmedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true, eligibleAt: eligibleAt.toISOString() });
  } catch (err: any) {
    console.error("confirm_signature_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
