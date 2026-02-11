// FILE: /pages/api/paypal/capture-order.ts
// Captures an approved PayPal order and writes the Firestore order record.

import type { NextApiRequest, NextApiResponse } from "next";
import { capturePayPalOrder, getPayPalOrder } from "../../../lib/paypal";
import { adminDb } from "../../../utils/firebaseAdmin";

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

    // Capture the order
    const captureResult = await capturePayPalOrder(paypalOrderId);

    const captureStatus = captureResult.status;
    if (captureStatus !== "COMPLETED") {
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
    });

    // Mark listing as sold
    if (listingId) {
      const listingRef = adminDb.collection("listings").doc(String(listingId));
      const listingSnap = await listingRef.get();
      if (listingSnap.exists) {
        await listingRef.update({
          status: "sold",
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
