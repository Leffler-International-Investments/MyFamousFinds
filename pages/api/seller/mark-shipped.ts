// FILE: /pages/api/seller/mark-shipped.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Ok = { ok: true };
type Err = { ok: false; error: string };

function buildTrackingUrl(carrier: string, trackingNumber: string) {
  const carrierCode = String(carrier || "").toLowerCase().trim();
  const tn = encodeURIComponent(String(trackingNumber || "").trim());
  if (!tn) return "";

  if (carrierCode === "dhl") {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`;
  }
  if (carrierCode === "ups") {
    return `https://www.ups.com/track?loc=en_US&tracknum=${tn}`;
  }
  if (carrierCode === "fedex" || carrierCode === "fed ex") {
    return `https://www.fedex.com/fedextrack/?tracknumbers=${tn}`;
  }
  if (carrierCode === "auspost" || carrierCode === "australia post") {
    return `https://auspost.com.au/mypost/track/#/details/${tn}`;
  }
  return "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  const sellerId = getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, carrier, trackingNumber, signatureRequired } =
      (req.body || {}) as {
        orderId?: string;
        carrier?: string;
        trackingNumber?: string;
        signatureRequired?: boolean;
      };

    if (!orderId || !carrier || !trackingNumber) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const ref = adminDb.collection("orders").doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "order_not_found" });
    }

    const o: any = snap.data() || {};
    if (String(o.sellerId || "") !== String(sellerId)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const trackingUrl = buildTrackingUrl(String(carrier), String(trackingNumber));

    await ref.set(
      {
        status: "Shipped",
        updatedAt: FieldValue.serverTimestamp(),
        fulfillment: {
          ...(o.fulfillment || {}),
          stage: "SHIPPED",
          signatureRequired: signatureRequired !== false, // default true
          shippedAt: FieldValue.serverTimestamp(),
        },
        shipping: {
          ...(o.shipping || {}),
          status: "shipped",
          carrier: String(carrier),
          trackingNumber: String(trackingNumber),
          trackingUrl: trackingUrl || (o.shipping?.trackingUrl || ""),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("seller_mark_shipped_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
