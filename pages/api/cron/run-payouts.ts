// FILE: /pages/api/cron/run-payouts.ts
//
// Vercel Cron — runs every 12 hours (configured in vercel.json)
// 1. Checks payout settings — only runs if payoutMode === "stripe_connect_auto"
// 2. Finds orders past cooling period with signature confirmed
// 3. Transfers seller payouts via Stripe Connect
// 4. Skips silently when mode is "manual" (no-op)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../lib/payoutSettings";
import { getStripeClient } from "../../../lib/stripe";

type Data =
  | { ok: true; processed: number; paid: number; skipped: number; message?: string }
  | { ok: false; error: string };

// ── Auth: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" ──
function isCronAuthorized(req: NextApiRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const bearer = String(req.headers.authorization || "").replace("Bearer ", "");
    if (bearer === cronSecret) return true;
  }
  const adminSecret = process.env.ADMIN_API_SECRET;
  if (adminSecret) {
    const got = String(req.headers["x-admin-secret"] || "");
    if (got === adminSecret) return true;
  }
  return false;
}

function daysToMs(days: number) {
  return Math.max(0, days) * 24 * 60 * 60 * 1000;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isCronAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  try {
    // ── Check payout mode — skip if manual ──
    const settings = await getPayoutSettings();
    if (settings.payoutMode !== "stripe_connect_auto") {
      return res.status(200).json({
        ok: true,
        processed: 0,
        paid: 0,
        skipped: 0,
        message: "payout_mode_is_manual — skipping auto run",
      });
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return res.status(500).json({ ok: false, error: "stripe_not_configured" });
    }

    // ── Find orders that might be ready for payout ──
    const snap = await adminDb
      .collection("orders")
      .where("payout.status", "in", ["NOT_READY", "COOLING", "ELIGIBLE"])
      .limit(50)
      .get();

    const now = Date.now();
    let processed = 0;
    let paid = 0;
    let skipped = 0;

    for (const doc of snap.docs) {
      const o: any = doc.data() || {};
      const stage = String(o.fulfillment?.stage || "").toUpperCase();

      // Only process orders with confirmed signatures
      if (stage !== "SIGNATURE_CONFIRMED") {
        skipped++;
        continue;
      }

      const deliveredAtMs =
        o.fulfillment?.deliveredAt?.toDate?.()?.getTime?.() ||
        (o.fulfillment?.deliveredAt ? Date.parse(o.fulfillment.deliveredAt) : 0);

      if (!deliveredAtMs || !Number.isFinite(deliveredAtMs)) {
        skipped++;
        continue;
      }

      const coolingDays =
        typeof o.payout?.coolingDays === "number"
          ? o.payout.coolingDays
          : settings.defaultCoolingDays;

      const eligibleAt = deliveredAtMs + daysToMs(coolingDays);
      const isEligible = now >= eligibleAt;

      // Still cooling — update status and skip
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
        skipped++;
        continue;
      }

      // Mark as ELIGIBLE if not already
      if (o.payout?.status !== "ELIGIBLE") {
        await doc.ref.set(
          {
            payout: { ...(o.payout || {}), status: "ELIGIBLE", eligibleAt: new Date(eligibleAt) },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // ── Transfer funds via Stripe Connect ──
      const sellerId = String(o.sellerId || "");
      if (!sellerId) { skipped++; continue; }

      const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
      const seller: any = sellerSnap.exists ? sellerSnap.data() : null;
      const stripeAccountId = seller?.stripeAccountId;
      if (!stripeAccountId) { skipped++; continue; }

      const total = Number(o.totals?.total || o.total || 0);
      if (!Number.isFinite(total) || total <= 0) { skipped++; continue; }

      const platformCommissionPct = Number(o.payout?.platformCommissionPct ?? 15);
      const sellerAmount = Math.max(0, total * (1 - platformCommissionPct / 100));
      const currency = String(o.totals?.currency || o.currency || "USD").toLowerCase();

      try {
        await stripe.transfers.create({
          amount: Math.round(sellerAmount * 100),
          currency,
          destination: stripeAccountId,
          metadata: { orderId: doc.id, cronTriggered: "true" },
        });

        await doc.ref.set(
          {
            payout: {
              ...(o.payout || {}),
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

        paid++;
      } catch (err) {
        console.error(`payout_transfer_error order=${doc.id}`, err);
        skipped++;
      }

      processed++;
    }

    return res.status(200).json({ ok: true, processed, paid, skipped });
  } catch (err: any) {
    console.error("run_payouts_cron_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal_error" });
  }
}
