// FILE: /pages/api/orders/roadmap-diagnostic.ts
//
// Fetches a single order and returns the full UPS roadmap status for each stage.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";
import { getPayoutSettings } from "../../../lib/payoutSettings";

type Stage = {
  key: string;
  title: string;
  status: "complete" | "active" | "pending" | "warning" | "error";
  timestamp?: string | null;
  details?: string;
};

type RoadmapResponse =
  | {
      ok: true;
      order: {
        id: string;
        status?: string;
        buyerName?: string;
        buyerEmail?: string;
        sellerId?: string;
        listingTitle?: string;
        total?: number;
        currency?: string;
      };
      stages: Stage[];
      coolingDays: number;
      payoutMode: string;
      recommendations: string[];
    }
  | { ok: false; error: string };

function ts(val: any): string | null {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate().toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val?._seconds === "number")
    return new Date(val._seconds * 1000).toISOString();
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RoadmapResponse>
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
    if (!orderId) {
      return res.status(400).json({ ok: false, error: "missing_orderId" });
    }

    const snap = await adminDb.collection("orders").doc(String(orderId)).get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const o: any = snap.data() || {};
    const settings = await getPayoutSettings();
    const coolingDays =
      typeof o.payout?.coolingDays === "number"
        ? o.payout.coolingDays
        : settings.defaultCoolingDays;

    const stages: Stage[] = [];
    const recommendations: string[] = [];

    // ---------- 1. Order Placed ----------
    const orderCreated = ts(o.createdAt);
    const isPaid =
      o.paypalCaptured === true ||
      o.paypalStatus === "COMPLETED" ||
      String(o.status || "")
        .toLowerCase()
        .match(/paid|shipped|completed|paidout/);

    stages.push({
      key: "order_placed",
      title: "Order Placed",
      status: isPaid ? "complete" : "error",
      timestamp: orderCreated,
      details: isPaid
        ? `PayPal captured. Status: ${o.status || "paid"}`
        : "Payment not confirmed",
    });

    if (!isPaid) {
      recommendations.push(
        "Order payment has not been confirmed. Check PayPal capture status."
      );
    }

    // ---------- 2. UPS Label Provided ----------
    const hasLabel =
      !!o.shipping?.trackingNumber && !!o.shipping?.labelUrl;
    const labelGenerated = ts(o.shipping?.labelGeneratedAt);

    stages.push({
      key: "label_provided",
      title: "UPS Label Provided",
      status: hasLabel
        ? "complete"
        : isPaid
        ? "warning"
        : "pending",
      timestamp: labelGenerated,
      details: hasLabel
        ? `Tracking: ${o.shipping.trackingNumber} | Carrier: ${o.shipping.carrier || "UPS"}`
        : o.shipping?.labelError
        ? `Label error: ${o.shipping.labelError}`
        : "Label not yet generated",
    });

    if (!hasLabel && isPaid) {
      recommendations.push(
        o.shipping?.labelError
          ? `Label generation failed: ${o.shipping.labelError}. Use UPS Diagnostics to investigate.`
          : "UPS label has not been generated. Generate a label from the seller orders page or check UPS Diagnostics."
      );
    }

    // ---------- 3. Order Shipped / Picked Up ----------
    const stage = String(o.fulfillment?.stage || "").toUpperCase();
    const isShipped =
      stage === "SHIPPED" ||
      stage === "SIGNATURE_CONFIRMED" ||
      String(o.status || "").toLowerCase() === "shipped";
    const shippedAt = ts(o.fulfillment?.shippedAt);

    stages.push({
      key: "order_picked_up",
      title: "Order Picked Up",
      status: isShipped ? "complete" : hasLabel ? "warning" : "pending",
      timestamp: shippedAt,
      details: isShipped
        ? `Marked shipped${shippedAt ? "" : " (no timestamp)"}. Carrier: ${o.shipping?.carrier || "UPS"}`
        : hasLabel
        ? "Label generated but seller has not yet marked the order as shipped"
        : "Awaiting label generation",
    });

    if (!isShipped && hasLabel) {
      recommendations.push(
        "Label was generated but the order has not been marked as shipped. Seller should mark the order as shipped once the package is handed to UPS."
      );
    }

    // ---------- 4. Delivered ----------
    const deliveredAt = ts(o.fulfillment?.deliveredAt);
    const isDelivered =
      !!deliveredAt || stage === "SIGNATURE_CONFIRMED";

    stages.push({
      key: "delivered",
      title: "Delivered",
      status: isDelivered
        ? "complete"
        : isShipped
        ? "warning"
        : "pending",
      timestamp: deliveredAt,
      details: isDelivered
        ? "Package delivered to customer"
        : isShipped
        ? "Package in transit - awaiting delivery confirmation. NOTE: There is no automatic UPS webhook; admin must confirm delivery manually."
        : "Not yet shipped",
    });

    if (isShipped && !isDelivered) {
      recommendations.push(
        "The order is shipped but delivery has not been confirmed. Check UPS tracking and use the 'Confirm Signature' action when delivered."
      );
    }

    // ---------- 5. Customer Signature ----------
    const sigRequired = o.fulfillment?.signatureRequired !== false;
    const sigConfirmedAt = ts(o.fulfillment?.signatureConfirmedAt);
    const isSigConfirmed = stage === "SIGNATURE_CONFIRMED" && !!sigConfirmedAt;

    stages.push({
      key: "signature_confirmed",
      title: "Customer Signature Confirmed",
      status: isSigConfirmed
        ? "complete"
        : isDelivered
        ? "warning"
        : "pending",
      timestamp: sigConfirmedAt,
      details: isSigConfirmed
        ? `Signature confirmed by admin${sigRequired ? " (signature was required)" : ""}`
        : sigRequired
        ? "Signature required but not yet confirmed"
        : "Signature not required for this order",
    });

    if (isDelivered && !isSigConfirmed && sigRequired) {
      recommendations.push(
        "Delivery confirmed but signature has not been verified. Use 'Confirm Signature' in Management > Orders."
      );
    }

    // ---------- 6. Seller & Management Notification ----------
    // Check email outbox for confirmation emails
    let sellerNotified = false;
    let outboxDetails = "No delivery confirmation notification found in outbox";

    if (adminDb) {
      const outboxSnap = await adminDb
        .collection("email_outbox")
        .where("orderId", "==", String(orderId))
        .limit(50)
        .get();

      const events = outboxSnap.docs.map((d) => d.data());
      const confirmationEmails = events.filter(
        (e: any) =>
          String(e.eventType || "").includes("signature") ||
          String(e.eventType || "").includes("delivery_confirm") ||
          String(e.eventType || "").includes("delivered")
      );
      if (confirmationEmails.length > 0) {
        sellerNotified = true;
        outboxDetails = `${confirmationEmails.length} delivery/signature confirmation email(s) found`;
      } else if (isSigConfirmed) {
        outboxDetails =
          "Signature confirmed but no automated notification email was sent to seller/management";
      }
    }

    stages.push({
      key: "seller_mgmt_notified",
      title: "Seller & Management Notified",
      status: sellerNotified
        ? "complete"
        : isSigConfirmed
        ? "warning"
        : "pending",
      timestamp: sigConfirmedAt,
      details: isSigConfirmed
        ? outboxDetails
        : "Awaiting signature confirmation before notification",
    });

    if (isSigConfirmed && !sellerNotified) {
      recommendations.push(
        "Signature was confirmed but no automated email notification was sent to seller/management. Consider adding delivery confirmation emails."
      );
    }

    // ---------- 7. Cooling Period ----------
    const payoutStatus = String(o.payout?.status || "").toUpperCase();
    const eligibleAt = ts(o.payout?.eligibleAt);
    const isCooling = payoutStatus === "COOLING";
    const isCoolingDone =
      payoutStatus === "ELIGIBLE" ||
      payoutStatus === "PAID" ||
      payoutStatus === "PAIDOUT";

    let coolingDetails = "";
    if (isCoolingDone) {
      coolingDetails = `Cooling period complete (${coolingDays} days). Payout status: ${payoutStatus}`;
    } else if (isCooling) {
      coolingDetails = `Cooling period active (${coolingDays} days). Eligible at: ${eligibleAt || "unknown"}`;
    } else if (isSigConfirmed) {
      coolingDetails = `Payout status: ${payoutStatus || "PENDING"}. Cooling days: ${coolingDays}`;
    } else {
      coolingDetails = `${coolingDays}-day cooling period will start after signature confirmation`;
    }

    stages.push({
      key: "cooling_period",
      title: `Cooling Period (${coolingDays} Days)`,
      status: isCoolingDone
        ? "complete"
        : isCooling
        ? "active"
        : "pending",
      timestamp: isCooling || isCoolingDone ? eligibleAt : null,
      details: coolingDetails,
    });

    // ---------- 8. Payment Activated ----------
    const isPaidOut =
      payoutStatus === "PAID" || payoutStatus === "PAIDOUT";
    const paidOutAt = ts(o.payout?.paidOutAt);

    stages.push({
      key: "payment_activated",
      title: "Payment to Seller Activated",
      status: isPaidOut
        ? "complete"
        : isCoolingDone && !isPaidOut
        ? "warning"
        : "pending",
      timestamp: paidOutAt,
      details: isPaidOut
        ? `Paid via ${o.payout?.paidOutMethod || "unknown"}. Seller received: $${(o.payout?.sellerAmount || 0).toFixed(2)} (${100 - (o.payout?.platformCommissionPct || 15)}% after commission)`
        : isCoolingDone && !isPaidOut
        ? "Cooling period complete but payout has not been processed yet"
        : "Awaiting cooling period completion",
    });

    if (isCoolingDone && !isPaidOut) {
      recommendations.push(
        `Cooling period is complete and payout is ELIGIBLE. ${settings.payoutMode === "paypal_auto" ? "Run auto-payout or" : "Use"} Management > Payouts to release funds.`
      );
    }

    // --- general recommendations ---
    if (!o.shipping?.trackingUrl && o.shipping?.trackingNumber) {
      recommendations.push(
        "Tracking number exists but no tracking URL was generated. Check carrier configuration."
      );
    }

    return res.status(200).json({
      ok: true,
      order: {
        id: snap.id,
        status: o.status,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        sellerId: o.sellerId,
        listingTitle: o.listingTitle,
        total: o.totals?.total || o.total,
        currency: o.totals?.currency || o.currency || "USD",
      },
      stages,
      coolingDays,
      payoutMode: settings.payoutMode,
      recommendations,
    });
  } catch (err: any) {
    console.error("roadmap_diagnostic_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
