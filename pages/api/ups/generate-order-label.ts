// FILE: /pages/api/ups/generate-order-label.ts
// Generates a UPS shipping label for a paid order.
// Called by the seller (or internally after payment) when ready to ship.
//
// POST /api/ups/generate-order-label
// Body: {
//   orderId: string,
//   seller: { name, phone, address1, address2?, city, state, zip, country? },
//   pkg:    { weightLbs, lengthIn, widthIn, heightIn },
//   serviceCode?: string  // default "03" = UPS Ground
// }
//
// The buyer address is pulled from the order's shippingAddress field.
// On success: stores tracking number + label on the order and emails the seller.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";
import { createShippingLabel, type UpsAddress, type UpsPackage } from "../../../lib/ups";
import { sendMail } from "../../../utils/email";

type SuccessResponse = {
  ok: true;
  trackingNumber: string;
  trackingUrl: string;
  labelFormat: string;
};
type ErrorResponse = { ok: false; error: string };

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
    const { orderId, seller, pkg, serviceCode } = req.body || {};

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

    // Create shipment + label via UPS
    const result = await createShippingLabel({
      seller: sellerAddress,
      buyer: buyerAddress,
      pkg: pkgData,
      serviceCode: serviceCode || "03",
    });

    const trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(result.trackingNumber)}`;

    // Store tracking + label on the order
    await orderRef.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        shipping: {
          ...(order.shipping || {}),
          carrier: "UPS",
          trackingNumber: result.trackingNumber,
          trackingUrl,
          labelBase64: result.labelBase64,
          labelFormat: result.labelFormat,
          labelGeneratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    // Email seller with the label info
    try {
      // Look up seller email
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
            `You can download your label from the Seller Dashboard or print it directly.\n\n` +
            `Regards,\nThe MyFamousFinds Team\n`,
          `<p>Hello ${seller.name},</p>` +
            `<p style="font-size:16px;"><b>Your UPS shipping label is ready!</b></p>` +
            `<div style="padding:12px;background:#dbeafe;border-radius:6px;margin:12px 0;">` +
            `<p style="margin:4px 0;"><b>Order:</b> ${orderId}</p>` +
            `<p style="margin:4px 0;"><b>Item:</b> ${itemTitle}</p>` +
            `<p style="margin:4px 0;"><b>Tracking:</b> <a href="${trackingUrl}">${result.trackingNumber}</a></p>` +
            `</div>` +
            `<p>You can download your label from the Seller Dashboard or print it directly.</p>` +
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
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "UPS label generation error");
    console.error("[ups/generate-order-label] Error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
