// FILE: /pages/api/webhooks/paypal.ts
// Handles PayPal webhook events (payment capture, disputes, etc.)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { verifyPayPalWebhook } from "../../../lib/paypal";

export const config = {
  api: { bodyParser: false },
};

async function readBuffer(req: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!adminDb) {
    console.error("[paypal webhook] Firebase not configured");
    return res.status(500).end();
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  try {
    const buf = await readBuffer(req);
    const bodyStr = buf.toString("utf-8");

    // Verify webhook signature if webhook ID is configured
    if (webhookId) {
      const headers: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (typeof val === "string") headers[key.toLowerCase()] = val;
      }

      const isValid = await verifyPayPalWebhook({
        webhookId,
        headers,
        body: bodyStr,
      });

      if (!isValid) {
        console.error("[paypal webhook] Signature verification failed");
        return res.status(400).end("Invalid signature");
      }
    }

    const event = JSON.parse(bodyStr);
    const eventType = event.event_type || "";
    const eventId = event.id || "";

    // Idempotency check
    if (eventId) {
      const eventRef = adminDb.collection("paypal_events").doc(eventId);
      const alreadyHandled = await eventRef.get();
      if (alreadyHandled.exists) {
        return res.status(200).json({ received: true, duplicate: true });
      }
      await eventRef.set({ type: eventType, created: Date.now() });
    }

    // Handle specific event types
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Order was approved by buyer — you could auto-capture here
      // but we handle capture in the success page flow instead
      console.log("[paypal webhook] Order approved:", event.resource?.id);
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource || {};
      const paypalOrderId = capture.supplementary_data?.related_ids?.order_id || "";
      const captureId = capture.id || "";
      const amount = Number(capture.amount?.value || 0);
      const currency = capture.amount?.currency_code || "USD";

      if (paypalOrderId) {
        // Check if order already exists
        const existingOrder = await adminDb
          .collection("orders")
          .where("paypalOrderId", "==", paypalOrderId)
          .limit(1)
          .get();

        if (existingOrder.empty) {
          // The webhook arrived before the capture-order endpoint — create the order
          const customId = capture.custom_id || "";

          let sellerId = "";
          if (customId) {
            const listingSnap = await adminDb
              .collection("listings")
              .doc(customId)
              .get();
            if (listingSnap.exists) {
              const listing: any = listingSnap.data() || {};
              sellerId = String(
                listing.sellerId ||
                  listing.sellerEmail ||
                  listing.seller ||
                  ""
              );
            }
          }

          await adminDb.collection("orders").add({
            paypalOrderId,
            paypalCaptureId: captureId,
            listingId: customId,
            ...(sellerId ? { sellerId } : {}),
            buyerEmail: "",
            buyerName: "",
            amountTotal: Math.round(amount * 100),
            currency,
            status: "paid",
            createdAt: Date.now(),
            source: "webhook",
          });

          // Mark listing sold
          if (customId) {
            const listingRef = adminDb.collection("listings").doc(customId);
            const listingSnap = await listingRef.get();
            if (listingSnap.exists) {
              await listingRef.update({
                status: "sold",
                isSold: true,
                soldAt: Date.now(),
              });
            }
          }
        }
      }
    }

    if (
      eventType === "CUSTOMER.DISPUTE.CREATED" ||
      eventType === "CUSTOMER.DISPUTE.UPDATED"
    ) {
      const dispute = event.resource || {};
      console.log("[paypal webhook] Dispute event:", eventType, dispute.dispute_id);

      // Log the dispute for the management team
      await adminDb.collection("paypal_disputes").add({
        disputeId: dispute.dispute_id || "",
        eventType,
        reason: dispute.reason || "",
        status: dispute.status || "",
        amount: dispute.dispute_amount?.value || 0,
        currency: dispute.dispute_amount?.currency_code || "USD",
        createdAt: Date.now(),
        raw: dispute,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[paypal webhook] Processing error:", err);
    return res.status(500).end();
  }
}
