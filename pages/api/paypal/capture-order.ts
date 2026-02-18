// FILE: /pages/api/paypal/capture-order.ts
// Captures an approved PayPal order and writes the Firestore order record.

import type { NextApiRequest, NextApiResponse } from "next";
import { capturePayPalOrder, getPayPalOrder } from "../../../lib/paypal";
import { adminDb } from "../../../utils/firebaseAdmin";
import {
  sendBuyerOrderConfirmationEmail,
  sendSellerItemSoldEmail,
} from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

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

    if (!existingOrder.empty) {
      const existing = existingOrder.docs[0];
      return res.status(200).json({
        ok: true,
        orderId: existing.id,
        captureId: existing.data().paypalCaptureId || "",
        status: "already_captured",
      });
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

    // Create the order in Firestore
    const orderRef = await adminDb.collection("orders").add({
      paypalOrderId,
      paypalCaptureId: captureId,
      listingId: listingId || pendingData.listingId || "",
      ...(sellerId ? { sellerId } : {}),
      buyerEmail: payerEmail,
      buyerName: payerName,
      listingTitle: pendingData.productTitle || "",
      listingBrand: pendingData.brand || "",
      listingCategory: pendingData.category || "",
      amountTotal: Math.round(amountTotal * 100), // store in cents for consistency
      currency,
      status: "paid",
      createdAt: Date.now(),
      shippingAddress,
      ...(pendingData.buyerId ? { buyerId: pendingData.buyerId } : {}),
      vipPointsAwarded: false,
      reviewRequestSent: false,
    });

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

    // Send buyer order confirmation email
    const amountStr = amountTotal.toFixed(2);
    const itemTitle = pendingData.productTitle || "Item";
    if (payerEmail) {
      try {
        await sendBuyerOrderConfirmationEmail({
          to: payerEmail,
          buyerName: payerName || undefined,
          orderId: orderRef.id,
          itemTitle,
          amount: amountStr,
          currency,
        });
      } catch (emailErr) {
        console.error("[capture-order] Buyer confirmation email failed, queueing to outbox:", emailErr);
        await queueEmail({
          to: payerEmail,
          subject: "MyFamousFinds — Order Confirmation",
          text:
            `Hello ${payerName || "there"},\n\n` +
            `Thank you for your purchase on MyFamousFinds!\n\n` +
            `Order ID: ${orderRef.id}\nItem: ${itemTitle}\nTotal: ${currency} ${amountStr}\n\n` +
            `We will process your order and keep you updated on shipping.\n\n` +
            `Regards,\nThe MyFamousFinds Team\n`,
          eventType: "buyer_order_confirmation",
          eventKey: `${orderRef.id}:buyer_order_confirmation`,
          metadata: { orderId: orderRef.id, buyerEmail: payerEmail },
        }).catch((qErr) => console.error("[capture-order] Outbox queue also failed:", qErr));
      }
    }

    // Send seller sold notification email
    if (sellerId) {
      let sellerEmail = "";
      let sellerName = "";
      try {
        const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
        const sellerData = sellerDoc.exists ? sellerDoc.data() || {} : {};
        sellerEmail = String(
          sellerData.contactEmail || sellerData.email || sellerId
        );
        sellerName = String(sellerData.businessName || sellerData.name || "");
      } catch (lookupErr) {
        console.error("[capture-order] Seller lookup failed:", lookupErr);
      }

      if (sellerEmail && sellerEmail.includes("@")) {
        const sellerSubject = "MyFamousFinds — Your Item Has Been Sold!";
        const sellerText =
          `Hello ${sellerName || "Seller"},\n\n` +
          `Great news — your item has been sold on MyFamousFinds!\n\n` +
          `Item: ${itemTitle}\nSale Amount: ${currency} ${amountStr}\nOrder ID: ${orderRef.id}\n\n` +
          `Please prepare the item for shipping. You can view the order details in your Seller Dashboard.\n\n` +
          `Regards,\nThe MyFamousFinds Team\n`;
        const sellerHtml =
          `<p>Hello ${sellerName || "Seller"},</p>` +
          `<p style="font-size:16px;"><b>Great news — your item has been sold on MyFamousFinds!</b></p>` +
          `<div style="padding:12px;background:#fef3c7;border-radius:6px;margin:12px 0;">` +
          `<p style="margin:4px 0;"><b>Item:</b> ${itemTitle}</p>` +
          `<p style="margin:4px 0;"><b>Sale Amount:</b> ${currency} ${amountStr}</p>` +
          `<p style="margin:4px 0;"><b>Order ID:</b> ${orderRef.id}</p>` +
          `</div>` +
          `<p>Please prepare the item for shipping. You can view the order details in your Seller Dashboard.</p>` +
          `<p>Regards,<br/>The MyFamousFinds Team</p>`;

        // Try direct send first, queue to outbox on failure
        try {
          await sendSellerItemSoldEmail({
            to: sellerEmail,
            sellerName,
            itemTitle,
            amount: amountStr,
            currency,
            orderId: orderRef.id,
          });
        } catch (emailErr) {
          console.error("[capture-order] Seller notification email failed, queueing to outbox:", emailErr);
          await queueEmail({
            to: sellerEmail,
            subject: sellerSubject,
            text: sellerText,
            html: sellerHtml,
            eventType: "seller_item_sold",
            eventKey: `${orderRef.id}:seller_item_sold:${sellerId}`,
            metadata: { orderId: orderRef.id, sellerId, sellerEmail, itemTitle },
          }).catch((qErr) => console.error("[capture-order] Outbox queue also failed:", qErr));
        }
      } else {
        console.error(`[capture-order] No valid seller email found for sellerId=${sellerId}`);
      }
    } else {
      console.error(`[capture-order] No sellerId on listing ${listingId} — seller notification skipped`);
    }

    return res.status(200).json({
      ok: true,
      orderId: orderRef.id,
      captureId,
      status: "captured",
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "PayPal capture error");
    console.error("PayPal capture error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
