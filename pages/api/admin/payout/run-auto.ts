// FILE: /pages/api/admin/payout/run-auto.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/authServer";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../../lib/payoutSettings";
import { getStripeClient } from "../../../../lib/stripe";

function daysToMs(days: number) {
  return Math.max(0, days) * 24 * 60 * 60 * 1000;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdmin(req);

    const settings = await getPayoutSettings();
    if (settings.payoutMode !== "stripe_connect_auto") {
      return res.status(200).json({ ok: true, message: "payout_mode_manual_noop" });
    }

    const stripe = await getStripeClient();
    if (!stripe) return res.status(500).json({ ok: false, error: "stripe_not_configured" });

    // Pull candidate orders
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
      const orderId = doc.id;

      const stage = String(o.fulfillment?.stage || "").toUpperCase();
      if (stage !== "SIGNATURE_CONFIRMED") continue;

      const deliveredAtMs = o.fulfillment?.deliveredAt?.toDate?.()?.getTime?.();
      if (!deliveredAtMs) continue;

      const coolingDays =
        typeof o.payout?.coolingDays === "number"
          ? o.payout.coolingDays
          : settings.defaultCoolingDays;

      const eligibleAt = deliveredAtMs + daysToMs(coolingDays);
      const isEligible = now >= eligibleAt;

      // mark eligible
      if (isEligible && o.payout?.status !== "ELIGIBLE") {
        await doc.ref.set(
          {
            payout: {
              ...o.payout,
              status: "ELIGIBLE",
              eligibleAt: new Date(eligibleAt),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (!isEligible) {
        // ensure cooling status
        if (o.payout?.status !== "COOLING") {
          await doc.ref.set(
            { payout: { ...o.payout, status: "COOLING", eligibleAt: new Date(eligibleAt) } },
            { merge: true }
          );
        }
        continue;
      }

      // Must have seller stripe account
      const sellerId = String(o.sellerId || "");
      if (!sellerId) continue;

      const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
      const seller: any = sellerSnap.exists ? sellerSnap.data() : null;
      const stripeAccountId = seller?.stripeAccountId;
      if (!stripeAccountId) continue;

      // Compute payout amount (simple version)
      // NOTE: replace this with your real commission logic if you have it already.
      const total = Number(o.totals?.total || o.total || 0);
      if (!Number.isFinite(total) || total <= 0) continue;

      const platformCommissionPct = Number(o.payout?.platformCommissionPct ?? 15); // example default
      const sellerAmount = Math.max(0, total * (1 - platformCommissionPct / 100));

      // Transfer to connected account (requires Stripe Connect)
      // Currency must be lowercase per Stripe
      const currency = String(o.totals?.currency || o.currency || "USD").toLowerCase();

      await stripe.transfers.create({
        amount: Math.round(sellerAmount * 100),
        currency,
        destination: stripeAccountId,
        metadata: { orderId },
      });

      await doc.ref.set(
        {
          payout: {
            ...o.payout,
            status: "PAID",
            paidOutAt: new Date(),
            paidOutMethod: "stripe_connect_auto",
            sellerAmount,
            platformCommissionPct,
          },
          status: "PaidOut",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      processed++;
      paid++;
    }

    return res.status(200).json({ ok: true, processed, paid });
  } catch (e: any) {
    return res.status(401).json({ ok: false, error: e?.message || "unauthorized" });
  }
}
