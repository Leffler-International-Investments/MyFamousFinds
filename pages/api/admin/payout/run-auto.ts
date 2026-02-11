// FILE: /pages/api/admin/payout/run-auto.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../../lib/payoutSettings";
import { createPayPalPayout } from "../../../../lib/paypal";
import { requireAdmin } from "../../../../utils/adminAuth";

type Data =
  | { ok: true; processed: number; paid: number; message?: string }
  | { ok: false; error: string };

function daysToMs(days: number) {
  return Math.max(0, days) * 24 * 60 * 60 * 1000;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "firebase_not_configured" });
    }

    if (!requireAdmin(req, res)) {
      return;
    }

    const settings = await getPayoutSettings();
    if (settings.payoutMode !== "paypal_auto") {
      return res.status(200).json({
        ok: true,
        processed: 0,
        paid: 0,
        message: "payout_mode_manual_noop",
      });
    }

    const snap = await adminDb
      .collection("orders")
      .where("payout.status", "in", ["NOT_READY", "COOLING", "ELIGIBLE"])
      .limit(50)
      .get();

    const now = Date.now();
    let processed = 0;
    let paid = 0;

    for (const doc of snap.docs) {
      const o: any = doc.data() || {};
      const stage = String(o.fulfillment?.stage || "").toUpperCase();
      const status = String(o.status || "").toUpperCase();

      if (stage !== "SIGNATURE_CONFIRMED" && status !== "SIGNATURE_CONFIRMED") continue;

      const deliveredAtMs =
        o.fulfillment?.deliveredAt?.toDate?.()?.getTime?.() ||
        (o.fulfillment?.deliveredAt ? Date.parse(o.fulfillment.deliveredAt) : 0);

      if (!deliveredAtMs || !Number.isFinite(deliveredAtMs)) continue;

      const coolingDays =
        typeof o.payout?.coolingDays === "number"
          ? o.payout.coolingDays
          : settings.defaultCoolingDays;

      const eligibleAt = deliveredAtMs + daysToMs(coolingDays);
      const isEligible = now >= eligibleAt;

      if (!isEligible) {
        if (o.payout?.status !== "COOLING") {
          await doc.ref.set(
            {
              payout: { ...(o.payout || {}), status: "COOLING", eligibleAt: new Date(eligibleAt) },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        continue;
      }

      if (o.payout?.status !== "ELIGIBLE") {
        await doc.ref.set(
          {
            payout: { ...(o.payout || {}), status: "ELIGIBLE", eligibleAt: new Date(eligibleAt) },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      const sellerId = String(o.sellerId || "");
      if (!sellerId) continue;

      const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
      const seller: any = sellerSnap.exists ? sellerSnap.data() : null;
      const paypalEmail = seller?.paypalEmail;
      if (!paypalEmail) continue;

      const total = Number(o.totals?.total || o.total || 0);
      if (!Number.isFinite(total) || total <= 0) continue;

      const platformCommissionPct = Number(o.payout?.platformCommissionPct ?? 15);
      const sellerAmount = Math.max(0, total * (1 - platformCommissionPct / 100));

      const currency = String(o.totals?.currency || o.currency || "USD").toUpperCase();
      const senderBatchId = `ff_auto_${doc.id}_${Date.now()}`;

      await createPayPalPayout({
        recipientEmail: paypalEmail,
        amount: sellerAmount,
        currency,
        note: `Famous Finds auto payout for order ${doc.id}`,
        senderBatchId,
      });

      await doc.ref.set(
        {
          payout: {
            ...(o.payout || {}),
            status: "PAID",
            paidOutAt: new Date(),
            paidOutMethod: "paypal_auto",
            paypalPayoutBatchId: senderBatchId,
            sellerAmount,
            platformCommissionPct,
          },
          status: "PaidOut",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      processed += 1;
      paid += 1;
    }

    return res.status(200).json({ ok: true, processed, paid });
  } catch (e: any) {
    console.error("run_auto_payout_error", e);
    return res.status(500).json({ ok: false, error: e?.message || "internal_error" });
  }
}
