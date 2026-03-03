// FILE: /pages/api/paypal/capture-order.ts
// Captures an approved PayPal order and writes the Firestore order record.

import type { NextApiRequest, NextApiResponse } from "next";
import { capturePayPalOrder, getPayPalOrder } from "../../../lib/paypal";
import { adminDb } from "../../../utils/firebaseAdmin";
import {
  sendBuyerOrderConfirmationEmail,
  sendSellerItemSoldEmail,
} from "../../../utils/email";
import type { AutoLabelResult } from "../../../utils/autoGenerateLabel";
import { queueEmail } from "../../../utils/emailOutbox";
import { tryAutoGenerateLabel } from "../../../utils/autoGenerateLabel";
import { getPayoutSettings } from "../../../lib/payoutSettings";

type SuccessResponse = {
  ok: true;
  orderId: string;
  captureId: string;
  status: string;
};
type ErrorResponse = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    const { paypalOrderId, pendingOrderId } = req.body || {};

    if (!paypalOrderId) {
      return res.status(400).json({ ok: false, error: "Missing paypalOrderId" });
    }

    // Check for duplicate captures
    const existingOrder = await adminDb
      .collection("orders")
      .where("paypalOrderId", "==", paypalOrderId)
      .limit(1)
      .get();

    // If a fully-processed order exists (not from webhook), return early
    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      const existingData = existing.data() || {};
      if (existingData.buyerEmail && existingData.source !== "webhook") {
        return res.status(200).json({
          ok: true,
          orderId: existing.id,
          captureId: existingData.paypalCaptureId || "",
          status: "already_captured",
        });
      }
      // Otherwise the order was created by the webhook without buyer details
      // or email notifications — fall through to enrich and notify.
    }

    // Capture the order — fall back to reading it if already captured
    let captureResult: any;
    try {
      captureResult = await capturePayPalOrder(paypalOrderId);
    } catch (captureErr: any) {
      console.error("Capture call failed, trying getPayPalOrder:", captureErr?.message);
      captureResult = await getPayPalOrder(paypalOrderId);
    }

    const captureStatus = captureResult.status;
    if (captureStatus !== "COMPLETED" && captureStatus !== "APPROVED") {
      return res.status(400).json({
        ok: false,
        error: `PayPal order status: ${captureStatus}`,
      });
    }

    const purchaseUnit = captureResult.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const captureId = capture?.id || "";
    const listingId =
      purchaseUnit?.reference_id || purchaseUnit?.custom_id || "";

    // Load pending order details from Firestore
    let pendingData: any = {};
    if (pendingOrderId) {
      const pendingSnap = await adminDb
        .collection("pending_orders")
        .doc(pendingOrderId)
        .get();
      if (pendingSnap.exists) {
        pendingData = pendingSnap.data() || {};
      }
    }

    // Load listing to get sellerId
    let sellerId = "";
    if (listingId) {
      const listingSnap = await adminDb
        .collection("listings")
        .doc(String(listingId))
        .get();
      if (listingSnap.exists) {
        const listing: any = listingSnap.data() || {};
        sellerId = String(
          listing.sellerId || listing.sellerEmail || listing.seller || ""
        );
      }
    }

    // Extract payer info from PayPal response
    const payer = captureResult.payer || {};
    const payerEmail =
      payer.email_address || pendingData.buyerDetails?.email || "";
    const payerName =
      [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ") ||
      pendingData.buyerDetails?.fullName ||
      "";

    // ✅ SINGLE declaration of buyerFormEmail (FIXES redeclare error)
    // Reason: PayPal payer email can be different from the buyer's site account email.
    // We store buyerFormEmail so the buyer sees their order in-app even if PayPal email differs.
    const buyerFormEmail = String(pendingData?.buyerDetails?.email || "")
      .trim()
      .toLowerCase();

    const shipping = purchaseUnit?.shipping;
    const shippingAddress = shipping?.address
      ? {
          name: shipping.name?.full_name || payerName,
          line1: shipping.address.address_line_1 || "",
          line2: shipping.address.address_line_2 || "",
          city: shipping.address.admin_area_2 || "",
          state: shipping.address.admin_area_1 || "",
          postal_code: shipping.address.postal_code || "",
          country: shipping.address.country_code || "",
        }
      : pendingData.buyerDetails
      ? {
          name: pendingData.buyerDetails.fullName || "",
          line1: pendingData.buyerDetails.addressLine1 || "",
          line2: pendingData.buyerDetails.addressLine2 || "",
          city: pendingData.buyerDetails.city || "",
          state: pendingData.buyerDetails.state || "",
          postal_code: pendingData.buyerDetails.postalCode || "",
          country: pendingData.buyerDetails.country || "",
        }
      : null;

    const amountTotal = Number(capture?.amount?.value || 0);
    const currency = capture?.amount?.currency_code || "USD";

    // Determine payout eligibility based on cooling period
    let payoutField: Record<string, any> = {};
    try {
      const payoutSettings = await getPayoutSettings();
      const coolingDays = payoutSettings.defaultCoolingDays || 14;
      const eligibleAt = new Date(Date.now() + coolingDays * 24 * 60 * 60 * 1000).toISOString();
      payoutField = {
        payout: {
          status: coolingDays === 0 ? "ELIGIBLE" : "PENDING",
          eligibleAt,
          platformCommissionPct: 15,
        },
      };
    } catch {
      payoutField = {
        payout: {
          status: "ELIGIBLE",
          platformCommissionPct: 15,
        },
      };
    }

    // Create or update the order in Firestore
    let orderId: string;

    if (!existingOrder.empty) {
      // Webhook-created order exists — enrich it with buyer details
      const existing = existingOrder.docs[0];
      orderId = existing.id;
      sellerId = sellerId || existing.data()?.sellerId || "";

      await adminDb.collection("orders").doc(orderId).update({
        paypalCaptureId: captureId,
        buyerEmail: payerEmail,
        buyerName: payerName,
        ...(buyerFormEmail && buyerFormEmail !== payerEmail ? { buyerFormEmail } : {}),
        listingTitle: pendingData.productTitle || existing.data()?.listingTitle || "",
        listingBrand: pendingData.brand || "",
        listingCategory: pendingData.category || "",
        shippingAddress,
        ...(pendingData.buyerId ? { buyerId: pendingData.buyerId } : {}),
        source: "capture", // mark as fully processed
      });
    } else {
      const orderRef = await adminDb.collection("orders").add({
        paypalOrderId,
        paypalCaptureId: captureId,
        listingId: listingId || pendingData.listingId || "",
        ...(sellerId ? { sellerId } : {}),
        buyerEmail: payerEmail,
        buyerName: payerName,
        ...(buyerFormEmail && buyerFormEmail !== payerEmail ? { buyerFormEmail } : {}),
        listingTitle: pendingData.productTitle || "",
        listingBrand: pendingData.brand || "",
        listingCategory: pendingData.category || "",
        amountTotal: Math.round(amountTotal * 100), // store in cents
        currency,
        status: "paid",
        source: "capture",
        createdAt: Date.now(),
        shippingAddress,
        ...(pendingData.buyerId ? { buyerId: pendingData.buyerId } : {}),
        ...payoutField,
        vipPointsAwarded: false,
        reviewRequestSent: false,
      });
      orderId = orderRef.id;
    }

    // Mark listing as sold
    if (listingId) {
      const listingRef = adminDb.collection("listings").doc(String(listingId));
      const listingSnap = await listingRef.get();
      if (listingSnap.exists) {
        await listingRef.update({
          status: "Sold",
          isSold: true,
          soldAt: Date.now(),
        });
      }
    }

    // Clean up pending order
    if (pendingOrderId) {
      await adminDb
        .collection("pending_orders")
        .doc(pendingOrderId)
        .delete()
        .catch(() => {});
    }

    // ✅ Buyer confirmation: send to BOTH buyerFormEmail (site account) and payerEmail (PayPal)
    const amountStr = amountTotal.toFixed(2);
    const itemTitle = pendingData.productTitle || "Item";

    const buyerRecipients = Array.from(
      new Set(
        [buyerFormEmail, payerEmail]
          .map((e) => String(e || "").trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (buyerRecipients.length) {
      try {
        await adminDb.collection("orders").doc(orderId).update({
          buyerConfirmationEmailAttempted: true,
          buyerConfirmationRecipients: buyerRecipients,
        });
      } catch {}

      for (const recipient of buyerRecipients) {
        try {
          await sendBuyerOrderConfirmationEmail({
            to: recipient,
            buyerName: payerName || undefined,
            orderId,
            itemTitle,
            amount: amountStr,
            currency,
          });
          console.log(`[capture-order] Buyer confirmation email sent to ${recipient} for order ${orderId}`);
        } catch (emailErr) {
          console.error("[capture-order] Buyer confirmation email failed, queueing to outbox:", emailErr);
          await queueEmail({
            to: recipient,
            subject: "MyFamousFinds — Order Confirmation",
            text:
              `Hello ${payerName || "there"},\n\n` +
              `Thank you for your purchase on MyFamousFinds!\n\n` +
              `Order ID: ${orderId}\nItem: ${itemTitle}\nTotal: ${currency} ${amountStr}\n\n` +
              `We will process your order and keep you updated on shipping.\n\n` +
              `Regards,\nThe MyFamousFinds Team\n`,
            eventType: "buyer_order_confirmation",
            eventKey: `${orderId}:buyer_order_confirmation:${recipient}`,
            metadata: { orderId, buyerEmail: recipient },
          }).catch((qErr) => console.error("[capture-order] Outbox queue also failed:", qErr));
        }
      }
    }

    // ✅ Generate UPS label + send seller label email (awaited)
    let labelResult: AutoLabelResult = { generated: false, emailSent: false, buyerEmailSent: false };
    try {
      labelResult = await tryAutoGenerateLabel(orderId);
      if (labelResult.emailSent) {
        console.log(`[capture-order] Combined sale+label email sent for order ${orderId}`);
      }
    } catch (labelErr) {
      console.error("[capture-order] Auto-label generation failed (non-blocking):", labelErr);
    }

    // If label generation didn't send a seller email, send fallback "Item Sold"
    if (!labelResult.emailSent) {
      try {
        if (!sellerId) {
          console.error(`[capture-order] No sellerId on order ${orderId}`);
        } else {
          const sellerDoc = await adminDb.collection("sellers").doc(String(sellerId)).get();
          const sellerData: any = sellerDoc.exists ? sellerDoc.data() || {} : {};
          const sellerEmail = String(sellerData.contactEmail || sellerData.email || sellerId).trim();
          const sellerName = String(sellerData.businessName || sellerData.name || "").trim();

          if (sellerEmail && sellerEmail.includes("@")) {
            try {
              await sendSellerItemSoldEmail({
                to: sellerEmail,
                sellerName,
                itemTitle,
                amount: amountStr,
                currency,
                orderId,
              });
            } catch (err) {
              console.error("[capture-order] Seller email failed, queueing:", err);
              await queueEmail({
                to: sellerEmail,
                subject: "Famous Finds — Your Item Has Sold!",
                text:
                  `Hello ${sellerName || "Seller"},\n\n` +
                  `Congratulations — your item has been sold on Famous Finds!\n\n` +
                  `Item: ${itemTitle}\nSale Amount: ${currency} ${amountStr}\nOrder ID: ${orderId}\n\n` +
                  `Please prepare the item for shipping.\n\n` +
                  `Regards,\nThe Famous Finds Team\n`,
                eventType: "seller_item_sold",
                eventKey: `${orderId}:seller_item_sold:${sellerId}`,
                metadata: { orderId, sellerId, sellerEmail, itemTitle },
              }).catch((qErr) => console.error("[capture-order] Outbox queue also failed:", qErr));
            }
          } else {
            console.error(`[capture-order] No valid seller email found for sellerId=${sellerId}`);
          }
        }
      } catch (err) {
        console.error("[capture-order] Seller fallback email flow failed:", err);
      }
    }

    return res.status(200).json({
      ok: true,
      orderId,
      captureId,
      status: existingOrder.empty ? "captured" : "enriched",
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "PayPal capture error");
    console.error("PayPal capture error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
