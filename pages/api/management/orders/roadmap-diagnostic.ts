// FILE: /pages/api/management/orders/roadmap-diagnostic.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../../lib/payoutSettings";
import { requireAdmin } from "../../../../utils/adminAuth";

type RoadmapStep = {
  key: string;
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "blocked";
  completedAt?: string | null;
  details?: string;
};

type DiagnosticResult = {
  ok: true;
  order: {
    id: string;
    status: string;
    listingTitle: string;
    buyerName: string;
    buyerEmail: string;
    sellerName: string;
    sellerId: string;
    total: number;
    currency: string;
    createdAt: string;
  };
  steps: RoadmapStep[];
  cooling: {
    coolingDays: number;
    eligibleAt: string | null;
    daysRemaining: number | null;
    isEligible: boolean;
  };
  payout: {
    status: string;
    mode: string;
    sellerAmount: number | null;
    platformFee: number | null;
    paidAt: string | null;
  };
  warnings: string[];
};

type ErrResponse = { ok: false; error: string };

function tsToString(ts: any): string | null {
  if (!ts) return null;
  const d = ts?.toDate?.() ?? (typeof ts === "string" ? new Date(ts) : null);
  if (!d || isNaN(d.getTime())) return null;
  return d.toISOString();
}

function tsToMs(ts: any): number {
  if (!ts) return 0;
  const d = ts?.toDate?.() ?? (typeof ts === "string" ? new Date(ts) : null);
  if (!d || isNaN(d.getTime())) return 0;
  return d.getTime();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticResult | ErrResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const { orderId } = (req.body || {}) as { orderId?: string };
    if (!orderId || !String(orderId).trim()) {
      return res.status(400).json({ ok: false, error: "missing_orderId" });
    }

    const ref = adminDb.collection("orders").doc(String(orderId).trim());
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const d: any = snap.data() || {};
    const buyer = d.buyer || {};
    const settings = await getPayoutSettings();
    const now = Date.now();
    const warnings: string[] = [];

    // --- Build order summary ---
    const order = {
      id: snap.id,
      status: d.status || "Unknown",
      listingTitle: d.listingTitle || d.items?.[0]?.title || "",
      buyerName: buyer.name || d.buyerName || "",
      buyerEmail: buyer.email || d.buyerEmail || "",
      sellerName: d.sellerName || d.seller?.name || "",
      sellerId: d.sellerId || "",
      total: Number(d.totals?.total || d.total || 0),
      currency: String(d.totals?.currency || d.currency || "USD").toUpperCase(),
      createdAt: tsToString(d.createdAt) || "",
    };

    // --- Determine current stage ---
    const fulfillment = d.fulfillment || {};
    const payout = d.payout || {};
    const shipping = d.shipping || {};
    const adminCard = d.adminCard || {};
    const checklist = adminCard.checklist || {};
    const stage = String(fulfillment.stage || "").toUpperCase();
    const orderStatus = String(d.status || "").toLowerCase();

    const isRefundedOrCancelled =
      orderStatus === "refunded" || orderStatus === "cancelled";

    // --- Cooling period data ---
    const coolingDays =
      typeof payout.coolingDays === "number"
        ? payout.coolingDays
        : settings.defaultCoolingDays;

    const eligibleAtMs = tsToMs(payout.eligibleAt);
    const eligibleAtStr = tsToString(payout.eligibleAt);
    const daysRemaining =
      eligibleAtMs > 0
        ? Math.max(0, Math.ceil((eligibleAtMs - now) / (24 * 60 * 60 * 1000)))
        : null;
    const isEligible =
      payout.status === "ELIGIBLE" ||
      payout.status === "PAID" ||
      (eligibleAtMs > 0 && now >= eligibleAtMs);

    // --- Build roadmap steps ---
    const steps: RoadmapStep[] = [];

    // 1. Order Placed
    steps.push({
      key: "order_placed",
      label: "Order Placed",
      description: "Buyer completed checkout and payment was captured.",
      status: "completed",
      completedAt: tsToString(d.createdAt),
      details: order.total
        ? `${order.currency} ${order.total.toFixed(2)}`
        : undefined,
    });

    // 2. UPS Label Provided
    const hasLabel = !!shipping.labelUrl || !!shipping.trackingNumber;
    const labelFailed = shipping.labelStatus === "failed";
    steps.push({
      key: "label_provided",
      label: "UPS Label Provided",
      description:
        "Shipping label generated and made available to seller.",
      status: hasLabel
        ? "completed"
        : labelFailed
        ? "blocked"
        : isRefundedOrCancelled
        ? "upcoming"
        : stage === "PAID" || !stage
        ? "current"
        : "completed",
      completedAt: tsToString(shipping.labelGeneratedAt),
      details: hasLabel
        ? `Tracking: ${shipping.trackingNumber || "—"}`
        : labelFailed
        ? `Label failed: ${shipping.labelError || "Unknown error"}`
        : undefined,
    });

    if (labelFailed) {
      warnings.push(
        `UPS label generation failed: ${shipping.labelError || "Unknown error"}. The seller may need to generate a label manually.`
      );
    }

    // 3. Order Picked Up / Shipped
    const isShipped =
      stage === "SHIPPED" ||
      stage === "DELIVERED" ||
      stage === "SIGNATURE_CONFIRMED" ||
      checklist.shipped;
    steps.push({
      key: "order_shipped",
      label: "Order Picked Up",
      description: "UPS picked up the package from the seller.",
      status: isShipped
        ? "completed"
        : isRefundedOrCancelled
        ? "upcoming"
        : hasLabel
        ? "current"
        : "upcoming",
      completedAt: tsToString(fulfillment.shippedAt),
      details: shipping.carrier
        ? `Carrier: ${shipping.carrier}`
        : undefined,
    });

    // 4. Delivered
    const isDelivered =
      stage === "DELIVERED" ||
      stage === "SIGNATURE_CONFIRMED" ||
      checklist.delivered;
    steps.push({
      key: "delivered",
      label: "Delivered",
      description: "Package delivered to the buyer's address.",
      status: isDelivered
        ? "completed"
        : isRefundedOrCancelled
        ? "upcoming"
        : isShipped
        ? "current"
        : "upcoming",
      completedAt: tsToString(fulfillment.deliveredAt),
    });

    // 5. Customer Signature
    const isSigned =
      stage === "SIGNATURE_CONFIRMED" || checklist.signed;
    steps.push({
      key: "signature_confirmed",
      label: "Customer Signature",
      description:
        "Customer signed for the delivery. Seller and management received confirmation.",
      status: isSigned
        ? "completed"
        : isRefundedOrCancelled
        ? "upcoming"
        : isDelivered
        ? "current"
        : "upcoming",
      completedAt: tsToString(
        fulfillment.signatureConfirmedAt || payout.signatureConfirmedAt
      ),
    });

    // 6. Cooling Period
    const isCooling = payout.status === "COOLING";
    const coolingComplete = isEligible || payout.status === "PAID";
    steps.push({
      key: "cooling_period",
      label: `Cooling Period (${coolingDays} days)`,
      description: `${coolingDays}-day window for buyer complaints or returns. If none filed, payout is released.`,
      status: coolingComplete
        ? "completed"
        : isRefundedOrCancelled
        ? "upcoming"
        : isCooling
        ? "current"
        : "upcoming",
      completedAt: coolingComplete && eligibleAtStr ? eligibleAtStr : null,
      details: isCooling && daysRemaining !== null
        ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining (eligible: ${new Date(eligibleAtMs).toLocaleDateString("en-US")})`
        : coolingComplete
        ? "Cooling period complete — no complaints filed."
        : undefined,
    });

    // 7. Seller Payout Released
    const isPaid = payout.status === "PAID" || checklist.payoutPaid;
    const platformCommissionPct = Number(payout.platformCommissionPct ?? 15);
    const sellerAmount =
      typeof payout.sellerAmount === "number"
        ? payout.sellerAmount
        : order.total > 0
        ? order.total * (1 - platformCommissionPct / 100)
        : null;

    steps.push({
      key: "payout_released",
      label: "Seller Payout Released",
      description:
        "Payout sent to the seller after cooling period with no complaints.",
      status: isPaid
        ? "completed"
        : isRefundedOrCancelled
        ? "upcoming"
        : coolingComplete
        ? "current"
        : "upcoming",
      completedAt: tsToString(payout.paidAt || payout.paidOutAt),
      details: isPaid
        ? `Paid via ${payout.paidOutMethod || payout.method || "manual"}${sellerAmount != null ? ` — ${order.currency} ${sellerAmount.toFixed(2)}` : ""}`
        : sellerAmount != null
        ? `Estimated seller payout: ${order.currency} ${sellerAmount.toFixed(2)} (${platformCommissionPct}% platform fee)`
        : undefined,
    });

    // --- Extra warnings ---
    if (isRefundedOrCancelled) {
      warnings.push(
        `This order is ${d.status}. The roadmap reflects the final state.`
      );
    }

    if (isCooling && daysRemaining !== null && daysRemaining <= 2) {
      warnings.push(
        `Cooling period ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Payout will become eligible soon.`
      );
    }

    if (
      isSigned &&
      !isCooling &&
      !coolingComplete &&
      payout.status !== "COOLING" &&
      !isRefundedOrCancelled
    ) {
      warnings.push(
        "Signature was confirmed but cooling period was not started. The confirm-signature API may not have been called correctly."
      );
    }

    if (
      coolingComplete &&
      !isPaid &&
      !isRefundedOrCancelled &&
      settings.payoutMode === "manual"
    ) {
      warnings.push(
        "Cooling period is complete and payout mode is manual. A manager should release this payout."
      );
    }

    const platformFee =
      order.total > 0 ? order.total * (platformCommissionPct / 100) : null;

    return res.status(200).json({
      ok: true,
      order,
      steps,
      cooling: {
        coolingDays,
        eligibleAt: eligibleAtStr,
        daysRemaining,
        isEligible,
      },
      payout: {
        status: payout.status || "PENDING",
        mode: settings.payoutMode,
        sellerAmount,
        platformFee,
        paidAt: tsToString(payout.paidAt || payout.paidOutAt),
      },
      warnings,
    });
  } catch (err: any) {
    console.error("roadmap_diagnostic_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
