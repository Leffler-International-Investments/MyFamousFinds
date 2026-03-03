// FILE: /pages/api/webhooks/paypal.ts
// Handles PayPal webhook events (payment capture, disputes, etc.)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { verifyPayPalWebhook, getPayPalOrder } from "../../../lib/paypal";
import { tryAutoGenerateLabel } from "../../../utils/autoGenerateLabel";
import {
  sendBuyerOrderConfirmationEmail,
  sendSellerItemSoldEmail,
} from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";
import type { AutoLabelResult } from "../../../utils/autoGenerateLabel";

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

  if (!webhookId) {
    console.error("[paypal webhook] PAYPAL_WEBHOOK_ID is not configured — rejecting request");
    return res.status(500).end("Webhook verification not configured");
  }

  try {
    const buf = await readBuffer(req);
    const bodyStr = buf.toString("utf-8");

    // Verify webhook signature (mandatory)
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
        // Fetch full PayPal order to get buyer/shipping details
        let paypalOrder: any = null;
        try {
          paypalOrder = await getPayPalOrder(paypalOrderId);
        } catch (fetchErr) {
          console.error("[paypal webhook] Failed to fetch PayPal order details:", fetchErr);
        }

        // Extract buyer info from PayPal order
        const payer = paypalOrder?.payer || {};
        const purchaseUnit = paypalOrder?.purchase_units?.[0];
        const shipping = purchaseUnit?.shipping;

        const buyerEmail = payer.email_address || "";
        const buyerName = [payer.name?.given_name, payer.name?.surname]
          .filter(Boolean)
          .join(" ") || "";

        // Build shipping address from PayPal order data
        let shippingAddress: Record<string, string> | null = null;
        if (shipping?.address) {
          shippingAddress = {
            name: shipping.name?.full_name || buyerName || "",
            line1: shipping.address.address_line_1 || "",
            line2: shipping.address.address_line_2 || "",
            city: shipping.address.admin_area_2 || "",
            state: shipping.address.admin_area_1 || "",
            postal_code: shipping.address.postal_code || "",
            country: shipping.address.country_code || "",
          };
        }

        // Also check pending_orders for buyer details (fallback)
        const customId = capture.custom_id || purchaseUnit?.reference_id || "";
        let pendingData: any = null;
        try {
          const pendingSnap = await adminDb
            .collection("pending_orders")
            .where("paypalOrderId", "==", paypalOrderId)
            .limit(1)
            .get();
          if (!pendingSnap.empty) {
            pendingData = pendingSnap.docs[0].data() || {};
          }
        } catch (pendingErr) {
          console.warn("[paypal webhook] pending_orders lookup failed:", pendingErr);
        }

        // Use pending_orders buyer details as fallback for shipping address
        if (!shippingAddress && pendingData?.buyerDetails) {
          const bd = pendingData.buyerDetails;
          if (bd.addressLine1 && bd.city && bd.state && bd.postalCode) {
            shippingAddress = {
              name: bd.fullName || buyerName || "",
              line1: bd.addressLine1 || "",
              line2: bd.addressLine2 || "",
              city: bd.city || "",
              state: bd.state || "",
              postal_code: bd.postalCode || "",
              country: bd.country || "",
            };
          }
        }

        const resolvedBuyerEmail = buyerEmail || pendingData?.buyerDetails?.email || "";
        const resolvedBuyerName = buyerName || pendingData?.buyerDetails?.fullName || "";

        // Check if order already exists
        const existingOrder = await adminDb
          .collection("orders")
          .where("paypalOrderId", "==", paypalOrderId)
          .limit(1)
          .get();

        if (existingOrder.empty) {
          // The webhook arrived before the capture-order endpoint — create the order

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

          const newOrderRef = await adminDb.collection("orders").add({
            paypalOrderId,
            paypalCaptureId: captureId,
            listingId: customId,
            ...(sellerId ? { sellerId } : {}),
            buyerEmail: resolvedBuyerEmail,
            buyerName: resolvedBuyerName,
            ...(shippingAddress ? { shippingAddress } : {}),
            listingTitle: pendingData?.productTitle || "",
            amountTotal: Math.round(amount * 100),
            currency,
            status: "paid",
            createdAt: Date.now(),
            source: "webhook",
          });

          console.log(
            `[paypal webhook] Created order ${newOrderRef.id} for PayPal order ${paypalOrderId}` +
            ` — buyer: ${resolvedBuyerEmail || "(unknown)"}` +
            ` — shippingAddress: ${shippingAddress ? "present" : "MISSING"}`
          );

          // Send confirmation emails (non-blocking — don't fail the webhook)
          const whItemTitle = pendingData?.productTitle || "Item";
          const whAmountStr = amount.toFixed(2);
          const whOrderId = newOrderRef.id;

          if (resolvedBuyerEmail) {
            sendBuyerOrderConfirmationEmail({
              to: resolvedBuyerEmail,
              buyerName: resolvedBuyerName || undefined,
              orderId: whOrderId,
              itemTitle: whItemTitle,
              amount: whAmountStr,
              currency,
            }).catch((emailErr) => {
              console.error("[paypal webhook] Buyer email failed, queueing:", emailErr);
              queueEmail({
                to: resolvedBuyerEmail,
                subject: "MyFamousFinds — Order Confirmation",
                text:
                  `Hello ${resolvedBuyerName || "there"},\n\n` +
                  `Thank you for your purchase on MyFamousFinds!\n\n` +
                  `Order ID: ${whOrderId}\nItem: ${whItemTitle}\nTotal: ${currency} ${whAmountStr}\n\n` +
                  `We will process your order and keep you updated on shipping.\n\n` +
                  `Regards,\nThe MyFamousFinds Team\n`,
                eventType: "buyer_order_confirmation",
                eventKey: `${whOrderId}:buyer_order_confirmation`,
                metadata: { orderId: whOrderId, buyerEmail: resolvedBuyerEmail },
              }).catch((qErr) => console.error("[paypal webhook] Buyer outbox queue failed:", qErr));
            });
          }

          // Mark listing sold
          if (customId) {
            const listingRef = adminDb.collection("listings").doc(customId);
            const listingSnap = await listingRef.get();
            if (listingSnap.exists) {
              await listingRef.update({
                status: "Sold",
                isSold: true,
                soldAt: Date.now(),
              });
            }
          }

          // Generate UPS label + send combined branded seller email.
          // IMPORTANT: await so it completes before serverless function terminates.
          let labelResult: AutoLabelResult = { generated: false, emailSent: false, buyerEmailSent: false };
          try {
            labelResult = await tryAutoGenerateLabel(newOrderRef.id);
            if (labelResult.emailSent) {
              console.log(`[paypal webhook] Combined sale+label email sent for order ${newOrderRef.id}`);
            }
          } catch (labelErr) {
            console.error("[paypal webhook] Auto-label generation failed (non-blocking):", labelErr);
          }

          // Fall back to branded seller sold email without label
          if (!labelResult.emailSent && sellerId) {
            try {
              let sellerEmail = "";
              let sellerName = "";
              let sellerDoc = await adminDb!.collection("sellers").doc(sellerId).get();
              if (!sellerDoc.exists) {
                const byEmail = await adminDb!.collection("sellers").where("email", "==", sellerId).limit(1).get();
                if (!byEmail.empty) sellerDoc = byEmail.docs[0];
              }
              if (!sellerDoc.exists) {
                const byContact = await adminDb!.collection("sellers").where("contactEmail", "==", sellerId).limit(1).get();
                if (!byContact.empty) sellerDoc = byContact.docs[0];
              }
              const sellerData = sellerDoc.exists ? sellerDoc.data() || {} : {};
              sellerEmail = String(sellerData.contactEmail || sellerData.email || sellerId);
              sellerName = String(sellerData.businessName || sellerData.name || "");

              if (sellerEmail && sellerEmail.includes("@")) {
                await sendSellerItemSoldEmail({
                  to: sellerEmail,
                  sellerName,
                  itemTitle: whItemTitle,
                  amount: whAmountStr,
                  currency,
                  orderId: whOrderId,
                });
              }
            } catch (err) {
              console.error("[paypal webhook] Seller fallback email failed (non-blocking):", err);
            }
          }
        } else {
          // Order already exists — enrich with buyer details if missing, then try label
          const existingDoc = existingOrder.docs[0];
          const existingId = existingDoc.id;
          const existingData: any = existingDoc.data() || {};

          const updates: Record<string, any> = {};

          if (!existingData.buyerEmail && resolvedBuyerEmail) {
            updates.buyerEmail = resolvedBuyerEmail;
          }
          if (!existingData.buyerName && resolvedBuyerName) {
            updates.buyerName = resolvedBuyerName;
          }
          if (!existingData.shippingAddress && shippingAddress) {
            updates.shippingAddress = shippingAddress;
          }
          if (!existingData.paypalCaptureId && captureId) {
            updates.paypalCaptureId = captureId;
          }

          if (Object.keys(updates).length > 0) {
            await adminDb.collection("orders").doc(existingId).update(updates);
            console.log(`[paypal webhook] Enriched existing order ${existingId} with:`, Object.keys(updates));
          }

          // Await label generation so it completes before serverless function terminates
          try {
            await tryAutoGenerateLabel(existingId);
          } catch (labelErr) {
            console.error("[paypal webhook] Auto-label generation failed (non-blocking):", labelErr);
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
