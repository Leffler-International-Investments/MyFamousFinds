// Paper Trade: Advance a paper-trade order through its lifecycle steps.
// Each call moves the order to the next stage in the fulfilment roadmap.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

const STAGES = [
  "PAID",
  "LABEL_GENERATED",
  "SHIPPED",
  "DELIVERED",
  "SIGNATURE_CONFIRMED",
  "COOLING_COMPLETE",
  "PAYOUT_RELEASED",
] as const;

type Stage = typeof STAGES[number];

function nextStage(current: string): Stage | null {
  const idx = STAGES.indexOf(current as Stage);
  if (idx < 0) return "LABEL_GENERATED"; // default start
  if (idx >= STAGES.length - 1) return null; // already done
  return STAGES[idx + 1];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const { orderId, targetStage } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const orderRef = adminDb.collection("orders").doc(String(orderId));
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const d: any = orderSnap.data() || {};
    const currentStage = String(d.fulfillment?.stage || "PAID").toUpperCase();
    const stage = targetStage ? String(targetStage).toUpperCase() : nextStage(currentStage);

    if (!stage) {
      return res.status(400).json({ error: "Order already completed all stages" });
    }

    const now = new Date();
    const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };

    switch (stage) {
      case "LABEL_GENERATED": {
        const trackingNumber = `1Z999PT${Date.now().toString().slice(-8)}`;
        update["shipping.carrier"] = "UPS";
        update["shipping.trackingNumber"] = trackingNumber;
        update["shipping.trackingUrl"] = `https://www.ups.com/track?tracknum=${trackingNumber}`;
        update["shipping.labelUrl"] = "(paper-trade — no real label)";
        update["shipping.labelFormat"] = "PDF";
        update["shipping.labelStatus"] = "generated";
        update["shipping.labelGeneratedAt"] = FieldValue.serverTimestamp();
        update["shipping.updatedAt"] = FieldValue.serverTimestamp();
        update["fulfillment.stage"] = "PAID"; // still paid, label just available
        break;
      }

      case "SHIPPED": {
        update["status"] = "Shipped";
        update["fulfillment.stage"] = "SHIPPED";
        update["fulfillment.shippedAt"] = FieldValue.serverTimestamp();
        update["shipping.status"] = "shipped";
        update["shipping.updatedAt"] = FieldValue.serverTimestamp();
        // Generate tracking if not already present
        if (!d.shipping?.trackingNumber) {
          const tn = `1Z999PT${Date.now().toString().slice(-8)}`;
          update["shipping.carrier"] = "UPS";
          update["shipping.trackingNumber"] = tn;
          update["shipping.trackingUrl"] = `https://www.ups.com/track?tracknum=${tn}`;
          update["shipping.labelStatus"] = "generated";
          update["shipping.labelGeneratedAt"] = FieldValue.serverTimestamp();
        }
        break;
      }

      case "DELIVERED": {
        update["status"] = "Delivered";
        update["fulfillment.stage"] = "DELIVERED";
        update["fulfillment.deliveredAt"] = FieldValue.serverTimestamp();
        update["shipping.status"] = "delivered";
        break;
      }

      case "SIGNATURE_CONFIRMED": {
        update["fulfillment.stage"] = "SIGNATURE_CONFIRMED";
        update["fulfillment.signatureConfirmedAt"] = FieldValue.serverTimestamp();
        // Start cooling period
        const coolingDays = 14;
        const eligibleAt = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);
        update["payout.status"] = "COOLING";
        update["payout.coolingDays"] = coolingDays;
        update["payout.eligibleAt"] = eligibleAt.toISOString();
        update["adminCard.checklist.signed"] = true;
        break;
      }

      case "COOLING_COMPLETE": {
        // Skip cooling period for paper trade
        update["payout.status"] = "ELIGIBLE";
        update["payout.eligibleAt"] = now.toISOString();
        update["adminCard.checklist.payoutReady"] = true;
        break;
      }

      case "PAYOUT_RELEASED": {
        update["status"] = "Completed";
        update["fulfillment.stage"] = "COMPLETED";
        update["payout.status"] = "PAID";
        update["payout.paidAt"] = FieldValue.serverTimestamp();
        update["payout.paidOutMethod"] = "paper-trade";
        update["adminCard.checklist.payoutPaid"] = true;
        update["adminCard.closed"] = true;
        update["adminCard.closedAt"] = FieldValue.serverTimestamp();
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown stage: ${stage}` });
    }

    await orderRef.update(update);

    return res.status(200).json({ ok: true, stage, orderId });
  } catch (e: any) {
    console.error("[PAPER_TRADE_ADVANCE]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
