// FILE: /pages/api/ups/generate-order-label.ts
// Generates a UPS shipping label for a paid order.
// Called by the seller (or internally after payment) when ready to ship.
//
// POST /api/ups/generate-order-label
// Body: {
//   orderId: string,
//   pkg:    { weightLbs, lengthIn, widthIn, heightIn },
//   serviceCode?: string,   // default "03" = UPS Ground
//   labelFormat?: "GIF" | "PDF",
//
//   // Optional override (normally NOT needed):
//   // If not provided, the API will look up the seller's stored address
//   // from seller_banking (preferred) or sellers profile.
//   seller?: { name, phone, address1, address2?, city, state, zip, country? },
// }
//
// The buyer address is pulled from the order's shippingAddress field.
//
// Idempotency: if the order already has a tracking number and label,
// the existing data is returned without calling UPS again.
//
// On success: uploads label to Firebase Storage, stores tracking number +
// label URL on the order, and emails the seller a download link.

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import sharp from "sharp";
import admin, {
  adminDb,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";
import {
  createShippingLabel,
  type UpsAddress,
  type UpsPackage,
} from "../../../lib/ups";
import { sendMail, sendBuyerShippingNotificationEmail } from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

type SuccessResponse = {
  ok: true;
  trackingNumber: string;
  trackingUrl: string;
  labelFormat: string;
  labelUrl: string;
  alreadyGenerated?: boolean;
};
type ErrorResponse = { ok: false; error: string };

// ── Firebase Storage helpers ──────────────────────────────────────────

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
    throw new Error(
      "Firebase Storage is not configured — cannot upload label. " +
        "Set FIREBASE_STORAGE_BUCKET in env."
    );
  }

  let buffer: Buffer = Buffer.from(labelBase64, "base64");
  let contentType =
    CONTENT_TYPES[labelFormat.toUpperCase()] || "application/octet-stream";
  let ext = labelFormat.toLowerCase(); // "gif" or "pdf"

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
      console.warn("[generate-order-label] Failed to process label image, using original:", err);
    }
  }

  const path = `shipping-labels/${orderId}/label.${ext}`;
  const token = crypto.randomUUID();

  await bucket.file(path).save(buffer, {
    metadata: {
      contentType,
      cacheControl: "private, max-age=86400",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false,
  });

  return buildDownloadUrl(STORAGE_BUCKET, path, token);
}

// ── Seller address resolution ─────────────────────────────────────────
//
// IMPORTANT: UPS label creation needs a complete shipper ("from") address.
// In the UI, we should NOT hardcode blank seller address fields.
// This API now auto-resolves the address server-side.
//
// Priority:
//  1) Explicit seller address provided in request (override)
//  2) seller_banking/<sellerEmail> (preferred)
//  3) sellers/<sellerId> profile address (fallback, if present)

function isCompleteAddress(a: Partial<UpsAddress> | undefined | null) {
  return !!(a && a.name && a.address1 && a.city && a.state && a.zip);
}

async function getSellerAddressFromStorage(
  sellerId: string
): Promise<UpsAddress | null> {
  if (!adminDb) return null;

  // 1) Pull seller email/name/phone
  let sellerEmail = "";
  let sellerName = "";
  let sellerPhone = "";

  const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
  if (sellerDoc.exists) {
    const sd: any = sellerDoc.data() || {};
    sellerEmail = String(sd.contactEmail || sd.email || "")
      .trim()
      .toLowerCase();
    sellerName = String(sd.businessName || sd.name || "");
    sellerPhone = String(sd.phone || "");
  }

  if (!sellerEmail) {
    const byEmail = await adminDb
      .collection("sellers")
      .where("email", "==", sellerId)
      .limit(1)
      .get();
    if (!byEmail.empty) {
      const sd: any = byEmail.docs[0].data() || {};
      sellerEmail = String(sd.contactEmail || sd.email || "")
        .trim()
        .toLowerCase();
      sellerName = String(sd.businessName || sd.name || "");
      sellerPhone = String(sd.phone || "");
    }
  }

  // 2) Prefer seller_banking doc (structured payout/shipping address)
  if (sellerEmail) {
    const bankingDoc = await adminDb
      .collection("seller_banking")
      .doc(sellerEmail)
      .get();
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
          country: b.country || "US",
        };
      }
    }
  }

  // 3) Fallback: if seller profile has an address block
  if (sellerDoc.exists) {
    const sd: any = sellerDoc.data() || {};
    const addr = sd.address || sd.shippingAddress || null;

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
  }

  return null;
}

// ── Handler ───────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!adminDb) {
    return res
      .status(500)
      .json({ ok: false, error: "Firebase not configured" });
  }

  // Authenticate seller
  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, seller, pkg, serviceCode, labelFormat: reqLabelFormat } =
      req.body || {};

    if (!orderId) {
      return res.status(400).json({ ok: false, error: "Missing orderId" });
    }
    if (!pkg?.weightLbs || !pkg?.lengthIn || !pkg?.widthIn || !pkg?.heightIn) {
      return res.status(400).json({
        ok: false,
        error: "Missing or incomplete package dimensions/weight",
      });
    }

    // Load order and verify ownership
    const orderRef = adminDb.collection("orders").doc(String(orderId));
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    const order: any = orderSnap.data() || {};
    if (String(order.sellerId || "") !== String(sellerId)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    // ── Verify order is paid (PayPal) before generating a label ──
    const isPaid =
      order.paypalCaptured === true ||
      String(order.paypalStatus || "").toUpperCase() === "COMPLETED" ||
      String(order.status || "").toLowerCase() === "paid" ||
      String(order.fulfillment?.stage || "").toUpperCase() === "PAID";

    if (!isPaid) {
      return res.status(400).json({
        ok: false,
        error: "Order has not been paid yet — cannot generate shipping label",
      });
    }

    // ── Idempotency: if order already has tracking + label, return existing data ──
    const existingShipping = order.shipping;
    if (existingShipping?.trackingNumber && existingShipping?.labelUrl) {
      return res.status(200).json({
        ok: true,
        trackingNumber: existingShipping.trackingNumber,
        trackingUrl:
          existingShipping.trackingUrl ||
          `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(
            existingShipping.trackingNumber
          )}`,
        labelFormat: existingShipping.labelFormat || "GIF",
        labelUrl: existingShipping.labelUrl,
        alreadyGenerated: true,
      });
    }

    // Extract buyer shipping address from the order
    const sa = order.shippingAddress;
    if (!sa || !sa.line1 || !sa.city || !sa.state || !sa.postal_code) {
      return res.status(400).json({
        ok: false,
        error: "Order is missing buyer shipping address — cannot generate label",
      });
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

    // Resolve seller address (override -> stored)
    let sellerAddress: UpsAddress | null = null;

    if (isCompleteAddress(seller)) {
      sellerAddress = {
        name: seller.name,
        phone: seller.phone || "",
        address1: seller.address1,
        address2: seller.address2 || "",
        city: seller.city,
        state: seller.state,
        zip: seller.zip,
        country: seller.country || "US",
      };
    } else {
      sellerAddress = await getSellerAddressFromStorage(String(sellerId));
    }

    if (!sellerAddress) {
      return res.status(400).json({
        ok: false,
        error:
          "Seller shipping address not found. Please complete Seller Banking / Payout details (address) first.",
      });
    }

    const pkgData: UpsPackage = {
      weightLbs: Number(pkg.weightLbs),
      lengthIn: Number(pkg.lengthIn),
      widthIn: Number(pkg.widthIn),
      heightIn: Number(pkg.heightIn),
    };

    // Validate label format — default to GIF
    const labelFormat: "GIF" | "PDF" =
      reqLabelFormat === "PDF"
        ? "PDF"
        : "GIF";

    // Create shipment + label via UPS
    const result = await createShippingLabel({
      seller: sellerAddress,
      buyer: buyerAddress,
      pkg: pkgData,
      serviceCode: serviceCode || "03",
      labelFormat: labelFormat || undefined,
    });

    const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(
      result.trackingNumber
    )}`;

    // Upload label to Firebase Storage
    const labelUrl = await uploadLabelToStorage(
      String(orderId),
      result.labelBase64,
      result.labelFormat
    );

    // Store tracking + label URL on the order (no base64 in Firestore)
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
          labelStatus: "generated",
          labelGeneratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    // Email seller with a download link — queue via email_outbox for reliable delivery
    try {
      let sellerEmail = "";
      const sellerDoc2 = await adminDb.collection("sellers").doc(sellerId).get();
      if (sellerDoc2.exists) {
        const sd: any = sellerDoc2.data() || {};
        sellerEmail = sd.contactEmail || sd.email || "";
      }

      if (sellerEmail && sellerEmail.includes("@")) {
        const itemTitle = order.listingTitle || "Item";
        const subject = "MyFamousFinds — Your UPS Shipping Label Is Ready";
        const text =
          `Hello ${sellerAddress.name},\n\n` +
          `Your UPS shipping label for order ${orderId} is ready!\n\n` +
          `Item: ${itemTitle}\n` +
          `Tracking Number: ${result.trackingNumber}\n` +
          `Track: ${trackingUrl}\n\n` +
          `Download label: ${labelUrl}\n\n` +
          `Thank you,\nMyFamousFinds`;

        // Send immediately AND queue (belt & suspenders)
        await sendMail({ to: sellerEmail, subject, text }).catch(() => {});

        await queueEmail({
          to: sellerEmail,
          subject,
          text,
          eventType: "ups_label_ready",
          eventKey: `ups_label_ready:${String(orderId)}`,
          metadata: {
            kind: "ups_label_ready",
            orderId: String(orderId),
            sellerId: String(sellerId),
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("[generate-order-label] Seller email notification failed:", e);
    }

    // Email buyer with tracking info
    try {
      const buyerEmail = order.buyerEmail || "";
      const buyerName = sa.name || order.buyerName || "";
      const itemTitle = order.listingTitle || "Item";

      if (buyerEmail && buyerEmail.includes("@")) {
        await sendBuyerShippingNotificationEmail({
          to: buyerEmail,
          buyerName: buyerName || undefined,
          orderId: String(orderId),
          itemTitle,
          trackingNumber: result.trackingNumber,
          trackingUrl,
          carrier: "UPS",
        }).catch(() => {});

        await queueEmail({
          to: buyerEmail,
          subject: "Famous Finds — Your Order Is Being Shipped!",
          text:
            `Hello ${buyerName || "there"},\n\n` +
            `Great news — your order is on its way!\n\n` +
            `Item: ${itemTitle}\nOrder ID: ${orderId}\n` +
            `Carrier: UPS\nTracking Number: ${result.trackingNumber}\n` +
            `Track: ${trackingUrl}\n\n` +
            `Regards,\nThe Famous Finds Team\n`,
          eventType: "buyer_shipping_notification",
          eventKey: `${String(orderId)}:buyer_shipping_notification`,
          metadata: { orderId: String(orderId), trackingNumber: result.trackingNumber },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("[generate-order-label] Buyer email notification failed:", e);
    }

    return res.status(200).json({
      ok: true,
      trackingNumber: result.trackingNumber,
      trackingUrl,
      labelFormat: result.labelFormat,
      labelUrl,
    });
  } catch (err: any) {
    console.error("[generate-order-label] Error:", err);

    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to generate UPS label",
    });
  }
}
