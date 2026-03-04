// Paper Trade: Simulate a full order cycle with REAL emails and REAL UPS labels.
// Creates an order in Firestore with status "paid" — same as a real PayPal capture.
// Then sends buyer confirmation email, and triggers auto UPS label generation
// which sends the seller the label + sends buyer shipping notification.
//
// Accepts an optional sellerAddress override — if provided, it is written to
// seller_banking so that tryAutoGenerateLabel() can find the sender address.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";
import { sendBuyerOrderConfirmationEmail, sendSellerItemSoldEmail } from "../../../../utils/email";
import { queueEmail } from "../../../../utils/emailOutbox";
import { tryAutoGenerateLabel } from "../../../../utils/autoGenerateLabel";

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
      sellerAddress,   // optional override: { name, phone, line1, line2, city, state, postalCode, country }
      sellerEmail: sellerEmailOverride, // optional: override seller contact email
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

    // Resolve seller info
    let sellerName = "";
    let resolvedSellerEmail = sellerEmailOverride ? String(sellerEmailOverride).trim().toLowerCase() : "";
    if (sellerId) {
      try {
        const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
        if (sellerSnap.exists) {
          const sd: any = sellerSnap.data() || {};
          sellerName = sd.businessName || sd.name || sellerId;
          if (!resolvedSellerEmail) {
            resolvedSellerEmail = sd.contactEmail || sd.email || "";
          }
        }
      } catch {}
    }

    // ── Auto-create/update seller_banking with seller address for UPS ──
    // tryAutoGenerateLabel() looks up seller address from seller_banking first.
    // If the manager provided a sellerAddress override, ensure it's stored.
    if (sellerAddress && sellerAddress.line1 && sellerAddress.city && sellerAddress.state && sellerAddress.postalCode) {
      const bankingKey = resolvedSellerEmail || sellerId;
      if (bankingKey) {
        try {
          await adminDb.collection("seller_banking").doc(bankingKey).set({
            sellerId: sellerId || bankingKey,
            sellerEmail: resolvedSellerEmail || "",
            legalName: sellerAddress.name || sellerName || "",
            businessName: sellerName || "",
            phone: sellerAddress.phone || "",
            addressLine1: sellerAddress.line1,
            addressLine2: sellerAddress.line2 || "",
            city: sellerAddress.city,
            state: sellerAddress.state,
            postalCode: sellerAddress.postalCode,
            country: sellerAddress.country || "US",
            updatedAt: FieldValue.serverTimestamp(),
            source: "paper_trade",
          }, { merge: true });
          console.log(`[paper-trade] seller_banking updated for ${bankingKey}`);
        } catch (bankErr) {
          console.warn("[paper-trade] Failed to update seller_banking:", bankErr);
        }
      }
    }

    // Also ensure the sellers doc has contactEmail so label email can be sent
    if (sellerId && resolvedSellerEmail) {
      try {
        await adminDb.collection("sellers").doc(sellerId).set({
          contactEmail: resolvedSellerEmail,
          email: resolvedSellerEmail,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch {}
    }

    const platformCommissionPct = 15;
    const platformFee = +(price * platformCommissionPct / 100).toFixed(2);
    const sellerPayout = +(price - platformFee).toFixed(2);

    const addr = shippingAddress || {};

    // Create the order (mirrors PayPal capture flow exactly)
    const orderRef = adminDb.collection("orders").doc();
    const orderId = orderRef.id;
    const orderData = {
      paperTrade: true,
      source: "paper-trade",

      paypalOrderId: `PT-${orderId.slice(0, 8).toUpperCase()}`,
      paypalCaptureId: `PT-CAP-${orderId.slice(0, 8).toUpperCase()}`,

      listingId: String(listingId),
      listingTitle: title,
      listingBrand: brand,
      listingCategory: category,

      sellerId,
      sellerName,

      buyerName: String(buyerName).trim(),
      buyerEmail: String(buyerEmail).trim().toLowerCase(),
      buyer: {
        name: String(buyerName).trim(),
        email: String(buyerEmail).trim().toLowerCase(),
        phone: String(buyerPhone || "").trim(),
      },

      amountTotal: Math.round(price * 100),
      currency,
      totals: { total: price, currency, platformFee, sellerPayout },

      shippingAddress: {
        name: addr.name || String(buyerName).trim(),
        line1: addr.line1 || "",
        line2: addr.line2 || "",
        city: addr.city || "",
        state: addr.state || "",
        postal_code: addr.postalCode || addr.postal_code || "",
        country: addr.country || "US",
      },

      status: "paid",
      fulfillment: { stage: "PAID", signatureRequired: true },
      payout: { status: "PENDING", platformCommissionPct },
      shipping: {},

      vipPointsAwarded: false,
      reviewRequestSent: false,
      buyerConfirmationEmailAttempted: true,
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

    // ── REAL Step 1: Send buyer order confirmation email ──
    const buyerAddr = String(buyerEmail).trim().toLowerCase();
    const amountStr = price.toFixed(2);
    let buyerEmailSent = false;
    let buyerEmailError = "";
    try {
      await sendBuyerOrderConfirmationEmail({
        to: buyerAddr,
        buyerName: String(buyerName).trim(),
        orderId,
        itemTitle: title,
        amount: amountStr,
        currency,
      });
      buyerEmailSent = true;
      console.log(`[paper-trade] Buyer confirmation email sent to ${buyerAddr}`);
    } catch (emailErr: any) {
      buyerEmailError = emailErr?.message || "Unknown email error";
      console.error("[paper-trade] Buyer confirmation email failed:", buyerEmailError);
      // Queue for retry
      await queueEmail({
        to: buyerAddr,
        subject: "MyFamousFinds — Order Confirmation",
        text:
          `Hello ${buyerName},\n\nThank you for your purchase on MyFamousFinds!\n\n` +
          `Order ID: ${orderId}\nItem: ${title}\nTotal: ${currency} ${amountStr}\n\n` +
          `We will process your order and keep you updated on shipping.\n\n` +
          `Regards,\nThe MyFamousFinds Team\n`,
        eventType: "buyer_order_confirmation",
        eventKey: `${orderId}:buyer_order_confirmation`,
        metadata: { orderId, buyerEmail: buyerAddr },
      }).catch((qErr) => console.error("[paper-trade] Outbox queue also failed:", qErr));
    }

    // ── REAL Step 2: Auto-generate UPS label + send seller email ──
    let labelResult = { generated: false, emailSent: false, buyerEmailSent: false, trackingNumber: "", labelUrl: "", error: "" };
    try {
      labelResult = await tryAutoGenerateLabel(orderId) as any;
      console.log(`[paper-trade] Auto label result for ${orderId}:`, {
        generated: labelResult.generated,
        emailSent: labelResult.emailSent,
        buyerEmailSent: labelResult.buyerEmailSent,
        trackingNumber: labelResult.trackingNumber || "(none)",
      });
    } catch (labelErr: any) {
      console.error("[paper-trade] Auto-label generation failed (non-blocking):", labelErr);
      labelResult.error = labelErr?.message || "Label generation failed";
    }

    // If label didn't send seller email, send fallback "Item Sold" notification
    let sellerEmailSent = labelResult.emailSent;
    let sellerEmailError = "";
    if (!sellerEmailSent && resolvedSellerEmail && resolvedSellerEmail.includes("@")) {
      try {
        await sendSellerItemSoldEmail({
          to: resolvedSellerEmail,
          sellerName: sellerName || "Seller",
          itemTitle: title,
          amount: amountStr,
          currency,
          orderId,
        });
        sellerEmailSent = true;
        console.log(`[paper-trade] Seller fallback email sent to ${resolvedSellerEmail}`);
      } catch (fallbackErr: any) {
        sellerEmailError = fallbackErr?.message || "Unknown email error";
        console.error("[paper-trade] Seller fallback email failed:", sellerEmailError);
      }
    }

    return res.status(200).json({
      ok: true,
      orderId,
      paypalOrderId: orderData.paypalOrderId,
      total: price,
      currency,
      listingTitle: title,
      sellerId,
      sellerName,
      sellerEmail: resolvedSellerEmail,
      buyerEmailSent,
      buyerEmailError,
      sellerEmailSent,
      sellerEmailError,
      labelGenerated: labelResult.generated,
      labelEmailSent: labelResult.emailSent,
      buyerShippingEmailSent: labelResult.buyerEmailSent,
      trackingNumber: labelResult.trackingNumber || "",
      labelUrl: labelResult.labelUrl || "",
      labelError: labelResult.error || "",
    });
  } catch (e: any) {
    console.error("[PAPER_TRADE_CREATE]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
