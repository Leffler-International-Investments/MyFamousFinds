// FILE: /pages/api/seller/wallet/payout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../../utils/authServer";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { createPayPalPayout } from "../../../../lib/paypal";

type Data = {
  ok: boolean;
  error?: string;
  payoutBatchId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    // Get seller's PayPal email
    const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
    const sellerData: any = sellerDoc.exists ? sellerDoc.data() : {};
    const paypalEmail = sellerData?.paypalEmail;

    if (!paypalEmail) {
      return res.status(400).json({
        ok: false,
        error: "No PayPal email configured. Please update your payout settings first.",
      });
    }

    // Calculate available balance
    let availableAmount = 0;
    const eligibleOrders: any[] = [];

    const ordersSnap = await adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .where("payout.status", "==", "ELIGIBLE")
      .get();

    for (const doc of ordersSnap.docs) {
      const o: any = doc.data() || {};
      const total = Number(o.amountTotal || o.totals?.total || o.total || 0) / 100;
      const platformCommissionPct = Number(o.payout?.platformCommissionPct ?? 15);
      const sellerAmount = Math.max(0, total * (1 - platformCommissionPct / 100));

      availableAmount += sellerAmount;
      eligibleOrders.push({ ref: doc.ref, sellerAmount, data: o });
    }

    if (availableAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "No available balance to pay out.",
      });
    }

    const senderBatchId = `ff_${sellerId}_${Date.now()}`;

    // Create PayPal payout
    const result = await createPayPalPayout({
      recipientEmail: paypalEmail,
      amount: availableAmount,
      currency: "USD",
      note: "Famous Finds seller payout",
      senderBatchId,
    });

    const payoutBatchId = result.batch_header?.payout_batch_id || senderBatchId;

    // Update all eligible orders as paid
    for (const order of eligibleOrders) {
      await order.ref.set(
        {
          payout: {
            ...(order.data.payout || {}),
            status: "PAID",
            paidOutAt: new Date(),
            paidOutMethod: "paypal_payout",
            paypalPayoutBatchId: payoutBatchId,
            sellerAmount: order.sellerAmount,
          },
          status: "PaidOut",
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    // Record payout in payouts collection
    await adminDb.collection("payouts").add({
      sellerId,
      paypalEmail,
      paypalPayoutBatchId: payoutBatchId,
      amount: availableAmount,
      currency: "USD",
      status: "completed",
      createdAt: new Date(),
    });

    res.status(200).json({ ok: true, payoutBatchId });
  } catch (err: any) {
    console.error("Error creating payout:", err);
    res.status(500).json({ ok: false, error: err?.message || "Internal Server Error" });
  }
}
