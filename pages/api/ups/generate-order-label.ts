// FILE: /pages/api/ups/generate-order-label.ts
// Generates a UPS shipping label for a paid order.
// Called by the seller (or internally after payment) when ready to ship.
//
// POST /api/ups/generate-order-label
// Body: {
//   orderId: string,
//   seller: { name, phone, address1, address2?, city, state, zip, country? },
//   pkg:    { weightLbs, lengthIn, widthIn, heightIn },
//   serviceCode?: string,   // default "03" = UPS Ground
//   labelFormat?: "GIF" | "PDF",
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
import admin, { adminDb, FieldValue, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";
import { createShippingLabel, type UpsAddress, type UpsPackage } from "../../../lib/ups";
import { sendMail } from "../../../utils/email";

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

  const ext = labelFormat.toLowerCase(); // "gif" or "pdf"
  const path = `shipping-labels/${orderId}/label.${ext}`;
  const buffer = Buffer.from(labelBase64, "base64");
  const contentType = CONTENT_TYPES[labelFormat.toUpperCase()] || "application/octet-stream";
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
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  // Authenticate seller
  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, seller, pkg, serviceCode, labelFormat: reqLabelFormat } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ ok: false, error: "Missing orderId" });
    }
    if (!seller?.name || !seller?.address1 || !seller?.city || !seller?.state || !seller?.zip) {
      return res.status(400).json({ ok: false, error: "Missing or incomplete seller address" });
    }
    if (!pkg?.weightLbs || !pkg?.lengthIn || !pkg?.widthIn || !pkg?.heightIn) {
      return res.status(400).json({ ok: false, error: "Missing or incomplete package dimensions/weight" });
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

    // ── Idempotency: if order already has tracking + label, return existing data ──
    const existingShipping = order.shipping;
    if (
      existingShipping?.trackingNumber &&
      existingShipping?.labelUrl
    ) {
      return res.status(200).json({
        ok: true,
        trackingNumber: existingShipping.trackingNumber,
        trackingUrl: existingShipping.trackingUrl || `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(existingShipping.trackingNumber)}`,
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

    const sellerAddress: UpsAddress = {
      name: seller.name,
      phone: seller.phone || "",
      address1: seller.address1,
      address2: seller.address2 || "",
      city: seller.city,
      state: seller.state,
      zip: seller.zip,
      country: seller.country || "US",
    };

    const pkgData: UpsPackage = {
      weightLbs: Number(pkg.weightLbs),
      lengthIn: Number(pkg.lengthIn),
      widthIn: Number(pkg.widthIn),
      heightIn: Number(pkg.heightIn),
    };

    // Validate label format
    const labelFormat: "GIF" | "PDF" =
      reqLabelFormat === "PDF" ? "PDF" : reqLabelFormat === "GIF" ? "GIF" : undefined as any;

    // Create shipment + label via UPS
    const result = await createShippingLabel({
      seller: sellerAddress,
      buyer: buyerAddress,
      pkg: pkgData,
      serviceCode: serviceCode || "03",
      labelFormat: labelFormat || undefined,
    });

    const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(result.trackingNumber)}`;

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
          labelGeneratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    // Email seller with a download link (not base64)
    try {
      let sellerEmail = "";
      const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
      if (sellerDoc.exists) {
        const sd: any = sellerDoc.data() || {};
        sellerEmail = sd.contactEmail || sd.email || "";
      }

      if (sellerEmail && sellerEmail.includes("@")) {
        const itemTitle = order.listingTitle || "Item";
        await sendMail(
          sellerEmail,
          "MyFamousFinds — Your UPS Shipping Label Is Ready",
          `Hello ${seller.name},\n\n` +
            `Your UPS shipping label for order ${orderId} is ready!\n\n` +
            `Item: ${itemTitle}\n` +
            `Tracking Number: ${result.trackingNumber}\n` +
            `Track: ${trackingUrl}\n\n` +
            `Download your label: ${labelUrl}\n\n` +
            `Regards,\nThe MyFamousFinds Team\n`,
          `<p>Hello ${seller.name},</p>` +
            `<p style="font-size:16px;"><b>Your UPS shipping label is ready!</b></p>` +
            `<div style="padding:12px;background:#dbeafe;border-radius:6px;margin:12px 0;">` +
            `<p style="margin:4px 0;"><b>Order:</b> ${orderId}</p>` +
            `<p style="margin:4px 0;"><b>Item:</b> ${itemTitle}</p>` +
            `<p style="margin:4px 0;"><b>Tracking:</b> <a href="${trackingUrl}">${result.trackingNumber}</a></p>` +
            `</div>` +
            `<p><a href="${labelUrl}" ` +
            `style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;` +
            `border-radius:999px;text-decoration:none;font-weight:600;">Download Shipping Label</a></p>` +
            `<p>Regards,<br/>The MyFamousFinds Team</p>`,
        );
      }
    } catch (emailErr) {
      // Label was generated successfully — don't fail the whole request for email issues
      console.error("[ups/generate-order-label] Email notification failed:", emailErr);
    }

    return res.status(200).json({
      ok: true,
      trackingNumber: result.trackingNumber,
      trackingUrl,
      labelFormat: result.labelFormat,
      labelUrl,
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "UPS label generation error");
    console.error("[ups/generate-order-label] Error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
