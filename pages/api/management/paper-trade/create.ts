// Paper Trade: Simulate a full order cycle without real PayPal payment.
// Creates a test order in Firestore with status "paid" — just like a real captured order.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  try {
    const {
      listingId,
      buyerName,
      buyerEmail,
      buyerPhone,
      shippingAddress,
    } = req.body || {};

    if (!listingId) return res.status(400).json({ error: "Missing listingId" });
    if (!buyerName || !buyerEmail) return res.status(400).json({ error: "Missing buyer details" });

    // Validate listing exists and is available
    const listingRef = adminDb.collection("listings").doc(String(listingId));
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) return res.status(404).json({ error: "Listing not found" });

    const listing: any = listingSnap.data() || {};
    const isSold = listing.isSold === true || listing.sold === true ||
      String(listing.status || "").toLowerCase() === "sold";
    if (isSold) return res.status(409).json({ error: "Listing already sold" });

    const price = typeof listing.priceUsd === "number"
      ? listing.priceUsd
      : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    const title = String(listing.title || listing.name || "Test Item").slice(0, 120);
    const brand = String(listing.brand || listing.designer || "");
    const category = String(listing.category || "");
    const currency = String(listing.currency || "USD").toUpperCase();
    const sellerId = String(listing.sellerId || listing.seller || "");

    // Resolve seller name
    let sellerName = "";
    if (sellerId) {
      try {
        const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
        sellerName = sellerSnap.data()?.name || sellerSnap.data()?.businessName || sellerId;
      } catch {}
    }

    const platformCommissionPct = 15;
    const platformFee = +(price * platformCommissionPct / 100).toFixed(2);
    const sellerPayout = +(price - platformFee).toFixed(2);

    const addr = shippingAddress || {};

    // Create the order (mirrors PayPal capture flow)
    const orderRef = adminDb.collection("orders").doc();
    const orderData = {
      // Paper trade marker
      paperTrade: true,
      source: "paper-trade",

      // Payment info (simulated)
      paypalOrderId: `PT-${orderRef.id.slice(0, 8).toUpperCase()}`,
      paypalCaptureId: `PT-CAP-${orderRef.id.slice(0, 8).toUpperCase()}`,

      // Listing
      listingId: String(listingId),
      listingTitle: title,
      listingBrand: brand,
      listingCategory: category,

      // Seller
      sellerId,
      sellerName,

      // Buyer
      buyerName: String(buyerName).trim(),
      buyerEmail: String(buyerEmail).trim().toLowerCase(),
      buyer: {
        name: String(buyerName).trim(),
        email: String(buyerEmail).trim().toLowerCase(),
        phone: String(buyerPhone || "").trim(),
      },

      // Totals
      amountTotal: Math.round(price * 100), // cents
      currency,
      totals: {
        total: price,
        currency,
        platformFee,
        sellerPayout,
      },

      // Shipping address
      shippingAddress: {
        name: addr.name || String(buyerName).trim(),
        line1: addr.line1 || "",
        line2: addr.line2 || "",
        city: addr.city || "",
        state: addr.state || "",
        postal_code: addr.postalCode || addr.postal_code || "",
        country: addr.country || "US",
      },

      // Order status — starts as "paid" (same as real capture)
      status: "paid",
      fulfillment: {
        stage: "PAID",
        signatureRequired: true,
      },
      payout: {
        status: "PENDING",
        platformCommissionPct,
      },
      shipping: {},

      // Metadata
      vipPointsAwarded: false,
      reviewRequestSent: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderData);

    // Mark listing as sold
    await listingRef.update({
      isSold: true,
      sold: true,
      status: "Sold",
      soldAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      orderId: orderRef.id,
      paypalOrderId: orderData.paypalOrderId,
      total: price,
      currency,
      listingTitle: title,
    });
  } catch (e: any) {
    console.error("[PAPER_TRADE_CREATE]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
