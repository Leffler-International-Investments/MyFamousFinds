// FILE: /pages/api/orders/updateAdminCard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type Data = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  if (!requireAdmin(req, res)) return;

  try {
    const { orderId, remarks, checklist, closed } = (req.body || {}) as {
      orderId?: string;
      remarks?: string;
      checklist?: {
        shipped?: boolean;
        delivered?: boolean;
        signed?: boolean;
        buyerConfirmed?: boolean;
        payoutReady?: boolean;
        payoutPaid?: boolean;
      };
      closed?: boolean;
    };

    if (!orderId) return res.status(400).json({ ok: false, error: "missing_fields" });

    await adminDb.collection("orders").doc(String(orderId)).set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        adminCard: {
          remarks: String(remarks || ""),
          checklist: {
            shipped: !!checklist?.shipped,
            delivered: !!checklist?.delivered,
            signed: !!checklist?.signed,
            buyerConfirmed: !!checklist?.buyerConfirmed,
            payoutReady: !!checklist?.payoutReady,
            payoutPaid: !!checklist?.payoutPaid,
          },
          closed: !!closed,
          closedAt: closed ? FieldValue.serverTimestamp() : null,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("updateAdminCard error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
