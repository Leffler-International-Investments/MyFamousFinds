import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";
import { sendSellerSoldWithLabelEmail } from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

type Ok = { ok: true; resent: true };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!adminDb) return res.status(500).json({ ok: false, error: "Firebase not configured" });

    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    const orderId = String(req.body?.orderId || "").trim();
    if (!orderId) return res.status(400).json({ ok: false, error: "Missing orderId" });

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ ok: false, error: "Order not found" });

    const order: any = orderSnap.data() || {};
    if (String(order.sellerId || "") !== String(sellerId)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const ship = order.shipping || {};
    const trackingNumber = String(ship.trackingNumber || "").trim();
    const labelUrl = String(ship.labelUrl || "").trim();
    const trackingUrl = String(
      ship.trackingUrl ||
        (trackingNumber
          ? `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(trackingNumber)}`
          : "")
    ).trim();

    if (!trackingNumber || !labelUrl) {
      return res.status(400).json({
        ok: false,
        error: "No generated label found for this order. Please generate a UPS label first.",
      });
    }

    // Resolve seller contact for delivery
    let sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
    if (!sellerDoc.exists) {
      const byEmail = await adminDb.collection("sellers").where("email", "==", sellerId).limit(1).get();
      if (!byEmail.empty) sellerDoc = byEmail.docs[0];
    }
    if (!sellerDoc.exists) {
      const byContact = await adminDb.collection("sellers").where("contactEmail", "==", sellerId).limit(1).get();
      if (!byContact.empty) sellerDoc = byContact.docs[0];
    }

    const sellerData: any = sellerDoc.exists ? sellerDoc.data() || {} : {};
    const sellerEmail = String(sellerData.contactEmail || sellerData.email || sellerId || "").trim();
    const sellerName = String(sellerData.businessName || sellerData.name || "").trim();

    if (!sellerEmail || !sellerEmail.includes("@")) {
      return res.status(400).json({ ok: false, error: "Seller email not found" });
    }

    const amountCents = Number(order.amountTotal || 0);
    const amount = amountCents > 0 ? (amountCents / 100).toFixed(2) : "0.00";
    const itemTitle = String(order.listingTitle || order.item || "Item");
    const currency = String(order.currency || "USD");
    const sa = order.shippingAddress || {};

    try {
      await sendSellerSoldWithLabelEmail({
        to: sellerEmail,
        sellerName: sellerName || undefined,
        itemTitle,
        amount,
        currency,
        orderId,
        trackingNumber,
        trackingUrl,
        labelUrl,
        buyerName: String(sa.name || order.buyerName || ""),
        buyerAddress:
          sa.line1 && sa.city && sa.state && sa.postal_code
            ? {
                line1: String(sa.line1),
                line2: String(sa.line2 || ""),
                city: String(sa.city),
                state: String(sa.state),
                postal_code: String(sa.postal_code),
                country: String(sa.country || "US"),
              }
            : undefined,
      });
    } catch (emailErr) {
      console.error("[resend-order-label] Seller resend email failed, queueing:", emailErr);
      await queueEmail({
        to: sellerEmail,
        subject: "Famous Finds — UPS Shipping Label (Resent)",
        text:
          `Hello ${sellerName || "Seller"},\n\n` +
          `As requested, here is your UPS shipping label again.\n\n` +
          `Order ID: ${orderId}\n` +
          `Item: ${itemTitle}\n` +
          `Tracking Number: ${trackingNumber}\n` +
          `Track: ${trackingUrl}\n` +
          `Label: ${labelUrl}\n\n` +
          `Regards,\nThe Famous Finds Team\n`,
        eventType: "seller_label_resent",
        eventKey: `seller_label_resent:${orderId}:${sellerEmail.toLowerCase()}`,
        metadata: { orderId, sellerEmail, trackingNumber, labelUrl },
      });
    }

    await orderRef.set(
      {
        updatedAt: Date.now(),
        shipping: {
          ...ship,
          labelResentAt: Date.now(),
          labelResentBySeller: true,
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true, resent: true });
  } catch (err: any) {
    console.error("[resend-order-label] Error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed to resend label" });
  }
}
