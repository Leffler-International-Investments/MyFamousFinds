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
import { sendMail } from "./email";
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

  let buffer = Buffer.from(labelBase64, "base64");
  let contentType = CONTENT_TYPES[labelFormat.toUpperCase()] || "application/octet-stream";
  let ext = labelFormat.toLowerCase();

  // For GIF labels, flatten to white background PNG so transparency doesn't cause issues
  if (labelFormat.toUpperCase() === "GIF") {
    try {
      buffer = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();
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

  const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
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
      const sd: any = byEmail.docs[0].data() || {};
      sellerEmail = String(sd.contactEmail || sd.email || "").trim().toLowerCase();
      sellerName = String(sd.businessName || sd.name || "");
      sellerPhone = String(sd.phone || "");
    }
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

  return null;
}

/**
 * Attempt to auto-generate a UPS shipping label for a paid order.
 *
 * - Idempotent: returns early if order already has tracking + label.
 * - Requires: order exists with shippingAddress and sellerId.
 * - Loads seller address from seller_banking collection.
 * - Uses default package dimensions if listing doesn't specify them.
 */
export async function tryAutoGenerateLabel(orderId: string): Promise<void> {
  if (!adminDb) {
    console.warn("[autoGenerateLabel] Firebase not configured — skipping");
    return;
  }

  const orderRef = adminDb.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    console.warn(`[autoGenerateLabel] Order ${orderId} not found — skipping`);
    return;
  }

  const order: any = orderSnap.data() || {};

  // Idempotency: skip if already has tracking number + label
  if (order.shipping?.trackingNumber && order.shipping?.labelUrl) {
    console.log(`[autoGenerateLabel] Order ${orderId} already has label — skipping`);
    return;
  }

  // Need seller ID to look up address
  const sellerId = order.sellerId;
  if (!sellerId) {
    console.warn(`[autoGenerateLabel] Order ${orderId} has no sellerId — skipping`);
    return;
  }

  // Need buyer shipping address
  const sa = order.shippingAddress;
  if (!sa || !sa.line1 || !sa.city || !sa.state || !sa.postal_code) {
    console.warn(`[autoGenerateLabel] Order ${orderId} missing buyer address — skipping`);
    return;
  }

  // Get seller address from banking/profile
  const sellerAddress = await getSellerAddress(sellerId);
  if (!sellerAddress) {
    console.warn(`[autoGenerateLabel] No stored address for seller ${sellerId} — skipping`);
    return;
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

  // Use default package dimensions
  const pkg = DEFAULT_PKG;

  // Create shipment + label via UPS
  const result = await createShippingLabel({
    seller: sellerAddress,
    buyer: buyerAddress,
    pkg,
    serviceCode: "03", // UPS Ground
  });

  const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(result.trackingNumber)}`;

  // Upload label to Firebase Storage
  const labelUrl = await uploadLabelToStorage(orderId, result.labelBase64, result.labelFormat);

  // Store tracking + label URL on the order
  await orderRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      shipping: {
        ...(order.shipping || {}),
        carrier: "UPS",
        trackingNumber: result.trackingNumber,
        trackingUrl,
        labelUrl,
        labelFormat: result.labelFormat,
        labelGeneratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        autoGenerated: true,
      },
    },
    { merge: true }
  );

  console.log(`[autoGenerateLabel] Label generated for order ${orderId}: ${result.trackingNumber}`);

  // Email seller with a download link — queue via email_outbox for reliable delivery
  try {
    let sellerEmail = "";
    const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
    if (sellerDoc.exists) {
      const sd: any = sellerDoc.data() || {};
      sellerEmail = sd.contactEmail || sd.email || "";
    }

    if (sellerEmail && sellerEmail.includes("@")) {
      const itemTitle = order.listingTitle || "Item";
      const subject = "MyFamousFinds — Your UPS Shipping Label Is Ready";
      const text =
        `Hello ${sellerAddress.name},\n\n` +
        `Your UPS shipping label for order ${orderId} has been automatically generated!\n\n` +
        `Item: ${itemTitle}\n` +
        `Tracking Number: ${result.trackingNumber}\n` +
        `Track: ${trackingUrl}\n\n` +
        `Download your label: ${labelUrl}\n\n` +
        `Please ship the item as soon as possible.\n\n` +
        `Regards,\nThe MyFamousFinds Team\n`;
      const html =
        `<p>Hello ${sellerAddress.name},</p>` +
        `<p style="font-size:16px;"><b>Your UPS shipping label is ready!</b></p>` +
        `<p>A shipping label has been automatically generated after payment was confirmed.</p>` +
        `<div style="padding:12px;background:#dbeafe;border-radius:6px;margin:12px 0;">` +
        `<p style="margin:4px 0;"><b>Order:</b> ${orderId}</p>` +
        `<p style="margin:4px 0;"><b>Item:</b> ${itemTitle}</p>` +
        `<p style="margin:4px 0;"><b>Tracking:</b> <a href="${trackingUrl}">${result.trackingNumber}</a></p>` +
        `</div>` +
        `<p><a href="${labelUrl}" ` +
        `style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;` +
        `border-radius:999px;text-decoration:none;font-weight:600;">Download Shipping Label</a></p>` +
        `<p>Please ship the item as soon as possible.</p>` +
        `<p>Regards,<br/>The MyFamousFinds Team</p>`;

      // Try email_outbox first (reliable, with retry), fall back to direct send
      const queued = await queueEmail({
        to: sellerEmail,
        subject,
        text,
        html,
        eventType: "shipping_label_auto_generated",
        eventKey: `${orderId}:shipping_label_auto_generated`,
        metadata: { orderId, trackingNumber: result.trackingNumber },
      });
      if (!queued) {
        await sendMail(sellerEmail, subject, text, html);
      }
    }
  } catch (emailErr) {
    // Label was generated — don't fail for email issues
    console.error("[autoGenerateLabel] Email notification failed:", emailErr);
  }
}
