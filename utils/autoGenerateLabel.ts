// FILE: /utils/autoGenerateLabel.ts
// Internal server-side function to auto-generate a UPS shipping label
// after PayPal payment is confirmed. Called from capture-order and webhook handlers.
//
// Idempotent: skips if the order already has a tracking number.
// Non-blocking: callers should fire-and-forget (catch errors, don't fail payment flow).

import crypto from "crypto";
import sharp from "sharp";
import admin, { adminDb, FieldValue, isFirebaseAdminReady } from "./firebaseAdmin";
import { createShippingLabel, type UpsAddress, type UpsPackage } from "../lib/ups";
import { sendSellerSoldWithLabelEmail, sendBuyerShippingNotificationEmail, sendSellerLabelActionRequiredEmail } from "./email";
import { queueEmail } from "./emailOutbox";

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

// Default package dimensions for auto-generated labels (luxury fashion items)
const DEFAULT_PKG: UpsPackage = {
  weightLbs: 3,
  lengthIn: 16,
  widthIn: 12,
  heightIn: 6,
};

function getBucket() {
  if (!isFirebaseAdminReady || !STORAGE_BUCKET) return null;
  return admin.storage().bucket(STORAGE_BUCKET);
}

function buildDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
}

const CONTENT_TYPES: Record<string, string> = {
  GIF: "image/gif",
  PDF: "application/pdf",
};

async function uploadLabelToStorage(
  orderId: string,
  labelBase64: string,
  labelFormat: string
): Promise<string> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Firebase Storage is not configured — cannot upload label.");
  }

  let buffer: Buffer = Buffer.from(labelBase64, "base64");
  let contentType = CONTENT_TYPES[labelFormat.toUpperCase()] || "application/octet-stream";
  let ext = labelFormat.toLowerCase();

  // For GIF labels, flatten to white background PNG so transparency doesn't cause issues
  if (labelFormat.toUpperCase() === "GIF") {
    try {
      const processed = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();
      buffer = Buffer.from(processed);
      contentType = "image/png";
      ext = "png";
    } catch (err) {
      console.warn("[autoGenerateLabel] Failed to process label image, using original:", err);
    }
  }

  const path = `shipping-labels/${orderId}/label.${ext}`;
  const token = crypto.randomUUID();

  await bucket.file(path).save(buffer, {
    metadata: {
      contentType,
      cacheControl: "private, max-age=86400",
      metadata: { firebaseStorageDownloadTokens: token },
    },
    resumable: false,
  });

  return buildDownloadUrl(STORAGE_BUCKET, path, token);
}

/**
 * Look up the seller's shipping address from seller_banking or sellers collection.
 * Returns null if no usable address is found.
 */
async function getSellerAddress(
  sellerId: string
): Promise<UpsAddress | null> {
  if (!adminDb) return null;

  // 1) Try seller_banking (has structured address from payout settings)
  // seller_banking docs are keyed by email — try to find the seller's email first
  let sellerEmail = "";
  let sellerName = "";
  let sellerPhone = "";

  let sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
  if (sellerDoc.exists) {
    const sd: any = sellerDoc.data() || {};
    sellerEmail = String(sd.contactEmail || sd.email || "").trim().toLowerCase();
    sellerName = String(sd.businessName || sd.name || "");
    sellerPhone = String(sd.phone || "");
  }

  if (!sellerEmail) {
    // Try finding seller by other lookups
    const byEmail = await adminDb.collection("sellers").where("email", "==", sellerId).limit(1).get();
    if (!byEmail.empty) {
      sellerDoc = byEmail.docs[0];
      const sd: any = byEmail.docs[0].data() || {};
      sellerEmail = String(sd.contactEmail || sd.email || "").trim().toLowerCase();
      sellerName = String(sd.businessName || sd.name || "");
      sellerPhone = String(sd.phone || "");
    }
  }

  if (!sellerEmail) {
    const byContactEmail = await adminDb
      .collection("sellers")
      .where("contactEmail", "==", sellerId)
      .limit(1)
      .get();
    if (!byContactEmail.empty) {
      sellerDoc = byContactEmail.docs[0];
      const sd: any = byContactEmail.docs[0].data() || {};
      sellerEmail = String(sd.contactEmail || sd.email || "").trim().toLowerCase();
      sellerName = String(sd.businessName || sd.name || "");
      sellerPhone = String(sd.phone || "");
    }
  }

  if (!sellerEmail && sellerId.includes("@")) {
    // Some orders persist sellerId as the seller email address directly.
    sellerEmail = sellerId.trim().toLowerCase();
  }

  if (sellerEmail) {
    const bankingDoc = await adminDb.collection("seller_banking").doc(sellerEmail).get();
    if (bankingDoc.exists) {
      const b: any = bankingDoc.data() || {};
      if (b.addressLine1 && b.city && b.state && b.postalCode) {
        return {
          name: b.legalName || sellerName || sellerId,
          phone: b.phone || sellerPhone || "",
          address1: b.addressLine1,
          address2: b.addressLine2 || "",
          city: b.city,
          state: b.state,
          zip: b.postalCode,
          country: "US",
        };
      }
    }
  }

  // Fallback: if seller profile has a structured address block, use it directly.
  if (sellerDoc.exists) {
    const sd: any = sellerDoc.data() || {};
    const addr = sd.shippingAddress || null;

    // Check for structured address object (with line1/address1)
    if (
      addr &&
      (addr.line1 || addr.address1) &&
      addr.city &&
      (addr.state || addr.stateProvince) &&
      (addr.postalCode || addr.zip)
    ) {
      return {
        name: sellerName || sellerId,
        phone: sellerPhone || "",
        address1: addr.line1 || addr.address1,
        address2: addr.line2 || addr.address2 || "",
        city: addr.city,
        state: addr.state || addr.stateProvince,
        zip: addr.postalCode || addr.zip,
        country: addr.country || "US",
      };
    }

    // Fallback: flat address fields from become-a-seller application
    // (address is a string like "123 Main St", city/state/zip are sibling fields)
    const flatAddress = String(sd.address || "").trim();
    const flatCity = String(sd.city || "").trim();
    const flatState = String(sd.state || "").trim();
    const flatZip = String(sd.zip || "").trim();
    const flatCountry = String(sd.country || "US").trim();

    if (flatAddress && flatCity && flatState && flatZip) {
      return {
        name: sellerName || sellerId,
        phone: sellerPhone || "",
        address1: flatAddress,
        address2: "",
        city: flatCity,
        state: flatState,
        zip: flatZip,
        country: flatCountry,
      };
    }
  }

  return null;
}

export interface AutoLabelResult {
  generated: boolean;
  emailSent: boolean;
  buyerEmailSent: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
}

/**
 * Attempt to auto-generate a UPS shipping label for a paid order,
 * then send a combined branded "Sale Confirmed + Shipping Label" email.
 *
 * - Idempotent: returns early if order already has tracking + label.
 * - Requires: order exists with shippingAddress and sellerId.
 * - Loads seller address from seller_banking collection.
 * - Uses default package dimensions if listing doesn't specify them.
 */
export async function tryAutoGenerateLabel(orderId: string): Promise<AutoLabelResult> {
  const noLabel: AutoLabelResult = { generated: false, emailSent: false, buyerEmailSent: false };

  if (!adminDb) {
    console.warn("[autoGenerateLabel] Firebase not configured — skipping");
    return { ...noLabel, error: "Firebase not configured" };
  }

  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    console.warn(`[autoGenerateLabel] Order ${orderId} not found — skipping`);
    return { ...noLabel, error: "Order not found" };
  }

  const order: any = orderSnap.data() || {};

  // Idempotency: skip if already has tracking number + label
  if (order.shipping?.trackingNumber && order.shipping?.labelUrl) {
    console.log(`[autoGenerateLabel] Order ${orderId} already has label — skipping`);
    return { generated: true, emailSent: false, buyerEmailSent: false, trackingNumber: order.shipping.trackingNumber, labelUrl: order.shipping.labelUrl };
  }

  // Need seller ID to look up address
  const sellerId = order.sellerId;
  if (!sellerId) {
    const errMsg = "Order has no sellerId";
    console.warn(`[autoGenerateLabel] Order ${orderId} ${errMsg} — skipping`);
    await persistLabelFailure(orderRef, order, errMsg);
    return { ...noLabel, error: errMsg };
  }

  // Need buyer shipping address
  const sa = order.shippingAddress;
  if (!sa || !sa.line1 || !sa.city || !sa.state || !sa.postal_code) {
    const errMsg = "Buyer shipping address incomplete or missing";
    console.warn(`[autoGenerateLabel] Order ${orderId} ${errMsg} — skipping`);
    await persistLabelFailure(orderRef, order, errMsg);
    await notifyAdminLabelFailure(orderId, String(order.sellerId || ""), errMsg).catch(() => {});
    return { ...noLabel, error: errMsg };
  }

  // Get seller address from banking/profile
  const sellerAddress = await getSellerAddress(sellerId);
  if (!sellerAddress) {
    const errMsg = `No stored address for seller ${sellerId}`;
    console.warn(`[autoGenerateLabel] ${errMsg} — skipping`);
    await persistLabelFailure(orderRef, order, errMsg);

    // IMPORTANT: notify seller what to do so they can receive the label.
    // Without this, the sale email may be sent but the label email never arrives.
    try {
      let sellerEmail = "";
      let sellerName = "";
      const sellerDoc = await adminDb.collection("sellers").doc(String(sellerId)).get();
      if (sellerDoc.exists) {
        const sd: any = sellerDoc.data() || {};
        sellerEmail = String(sd.contactEmail || sd.email || "").trim();
        sellerName = String(sd.businessName || sd.name || "").trim();
      }
      // sellerId is sometimes the email itself
      if (!sellerEmail && String(sellerId).includes("@")) sellerEmail = String(sellerId).trim();

      if (sellerEmail && sellerEmail.includes("@")) {
        await sendSellerLabelActionRequiredEmail({
          to: sellerEmail,
          sellerName: sellerName || undefined,
          orderId,
          itemTitle: order.listingTitle || "Item",
          reason:
            "we don't have your shipping address on file (street, city, state, zip). Please add it to generate your UPS label.",
        });
      }
    } catch (notifyErr) {
      console.error("[autoGenerateLabel] Failed to notify seller about missing address:", notifyErr);
    }

    return { ...noLabel, error: errMsg };
  }

  const buyerAddress: UpsAddress = {
    name: sa.name || order.buyerName || "Buyer",
    phone: sa.phone || "",
    address1: sa.line1,
    address2: sa.line2 || "",
    city: sa.city,
    state: sa.state,
    zip: sa.postal_code,
    country: sa.country || "US",
  };

  // Mark label as pending before calling UPS
  await orderRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      shipping: {
        ...(order.shipping || {}),
        labelStatus: "pending",
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  // Use default package dimensions
  const pkg = DEFAULT_PKG;

  let result;
  try {
    // Create shipment + label via UPS
    result = await createShippingLabel({
      seller: sellerAddress,
      buyer: buyerAddress,
      pkg,
      serviceCode: "03", // UPS Ground
    });
  } catch (upsErr: any) {
    const errMsg = upsErr?.message || "UPS API call failed";
    console.error(`[autoGenerateLabel] UPS label creation failed for order ${orderId}:`, errMsg);
    await persistLabelFailure(orderRef, order, errMsg);
    await notifyAdminLabelFailure(orderId, sellerId, errMsg);
    throw upsErr;
  }

  const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(result.trackingNumber)}`;

  // Upload label to Firebase Storage (non-fatal — label data is in base64 already)
  let labelUrl = "";
  try {
    labelUrl = await uploadLabelToStorage(orderId, result.labelBase64, result.labelFormat);
  } catch (storageErr: any) {
    const errMsg = storageErr?.message || "Firebase Storage upload failed";
    console.error(`[autoGenerateLabel] Label upload failed for order ${orderId}:`, errMsg);
    // Do NOT throw — we still have the tracking number and base64 label data.
    // Continue to save tracking info and send emails with inline attachment.
    console.log(`[autoGenerateLabel] Continuing without Storage URL — will use base64 attachment for emails`);
  }

  // Store tracking + label URL on the order with generated status
  await orderRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      fulfillment: {
        ...(order.fulfillment || {}),
        stage: "LABEL_GENERATED",
      },
      shipping: {
        ...(order.shipping || {}),
        carrier: "UPS",
        trackingNumber: result.trackingNumber,
        trackingUrl,
        ...(labelUrl ? { labelUrl } : {}),
        labelFormat: result.labelFormat,
        labelStatus: "generated",
        labelGeneratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        autoGenerated: true,
      },
    },
    { merge: true }
  );

  console.log(`[autoGenerateLabel] Label generated for order ${orderId}: ${result.trackingNumber}`);

  // Send combined branded "Sale Confirmed + Shipping Label" email to seller
  let emailSent = false;
  const itemTitle = order.listingTitle || "Item";
  const amountCents = Number(order.amountTotal || 0);
  const amountStr = amountCents > 0 ? (amountCents / 100).toFixed(2) : "0.00";
  const currency = order.currency || "USD";

  try {
    let sellerEmail = "";
    let sellerName = sellerAddress.name || "";
    const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
    if (sellerDoc.exists) {
      const sd: any = sellerDoc.data() || {};
      sellerEmail = sd.contactEmail || sd.email || "";
      sellerName = sd.businessName || sd.name || sellerName;
    }

    if (sellerEmail && sellerEmail.includes("@")) {
      await sendSellerSoldWithLabelEmail({
        to: sellerEmail,
        sellerName,
        itemTitle,
        amount: amountStr,
        currency,
        orderId,
        trackingNumber: result.trackingNumber,
        trackingUrl,
        labelUrl,
        labelBase64: result.labelBase64,
        labelFormat: result.labelFormat,
        buyerName: sa.name || order.buyerName || "",
        buyerAddress: {
          line1: sa.line1,
          line2: sa.line2 || "",
          city: sa.city,
          state: sa.state,
          postal_code: sa.postal_code,
          country: sa.country || "US",
        },
      });
      emailSent = true;
    }
  } catch (emailErr) {
    // Label was generated — don't fail for email issues
    console.error("[autoGenerateLabel] Seller combined email failed:", emailErr);
  }

  // Send buyer shipping notification email with tracking info
  let buyerEmailSent = false;
  try {
    const buyerEmail = order.buyerEmail || "";
    const buyerName = sa.name || order.buyerName || "";

    if (buyerEmail && buyerEmail.includes("@")) {
      await sendBuyerShippingNotificationEmail({
        to: buyerEmail,
        buyerName: buyerName || undefined,
        orderId,
        itemTitle,
        trackingNumber: result.trackingNumber,
        trackingUrl,
        carrier: "UPS",
      });
      buyerEmailSent = true;
    } else {
      console.warn(`[autoGenerateLabel] No buyer email on order ${orderId} — buyer notification skipped`);
    }
  } catch (buyerEmailErr) {
    console.error("[autoGenerateLabel] Buyer shipping notification email failed:", buyerEmailErr);
    // Queue as fallback
    try {
      const buyerEmail = order.buyerEmail || "";
      if (buyerEmail && buyerEmail.includes("@")) {
        await queueEmail({
          to: buyerEmail,
          subject: "Famous Finds — Your Order Is Being Shipped!",
          text:
            `Hello ${sa.name || order.buyerName || "there"},\n\n` +
            `Great news — your order is on its way!\n\n` +
            `Item: ${itemTitle}\nOrder ID: ${orderId}\n` +
            `Carrier: UPS\nTracking Number: ${result.trackingNumber}\n` +
            `Track: ${trackingUrl}\n\n` +
            `Regards,\nThe Famous Finds Team\n`,
          eventType: "buyer_shipping_notification",
          eventKey: `${orderId}:buyer_shipping_notification`,
          metadata: { orderId, trackingNumber: result.trackingNumber },
        });
      }
    } catch (qErr) {
      console.error("[autoGenerateLabel] Buyer email outbox queue also failed:", qErr);
    }
  }

  return {
    generated: true,
    emailSent,
    buyerEmailSent,
    trackingNumber: result.trackingNumber,
    labelUrl,
  };
}

/**
 * Persist label failure status on the order for operational visibility.
 */
async function persistLabelFailure(
  orderRef: admin.firestore.DocumentReference,
  order: any,
  errorMsg: string
) {
  try {
    await orderRef.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        shipping: {
          ...(order.shipping || {}),
          labelStatus: "failed",
          labelError: errorMsg,
          labelFailedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
  } catch (e) {
    console.error("[autoGenerateLabel] Failed to persist label failure status:", e);
  }
}

/**
 * Notify admin/management when label generation fails.
 */
async function notifyAdminLabelFailure(
  orderId: string,
  sellerId: string,
  errorMsg: string
) {
  try {
    const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
    if (adminEmails.length === 0 || !adminDb) return;

    for (const adminEmail of adminEmails) {
      await queueEmail({
        to: adminEmail,
        subject: `[ALERT] UPS Label Generation Failed — Order ${orderId}`,
        text:
          `UPS label generation failed for order ${orderId}.\n\n` +
          `Seller ID: ${sellerId}\n` +
          `Error: ${errorMsg}\n\n` +
          `Action required: Review the order and retry label generation, ` +
          `or contact the seller to resolve the issue.\n\n` +
          `— MyFamousFinds System`,
        eventType: "admin_label_failure",
        eventKey: `admin_label_failure:${orderId}`,
        metadata: { orderId, sellerId, error: errorMsg },
      });
    }
  } catch (e) {
    console.error("[autoGenerateLabel] Failed to notify admin of label failure:", e);
  }
}
