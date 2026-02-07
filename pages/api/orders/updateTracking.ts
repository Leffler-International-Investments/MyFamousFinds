// FILE: /pages/api/orders/updateTracking.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

type Data = { ok: true } | { ok: false; error: string };

function isAdminRequest(req: NextApiRequest) {
  const required = process.env.ADMIN_API_SECRET;
  if (!required) return true;
  const got = String(req.headers["x-admin-secret"] || "");
  return got && got === required;
}

function buildTrackingUrl(carrier: string, trackingNumber: string) {
  const carrierCode = String(carrier || "").toLowerCase().trim();
  const tn = encodeURIComponent(String(trackingNumber || "").trim());
  if (!tn) return "";

  if (carrierCode === "dhl") return `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`;
  if (carrierCode === "ups") return `https://www.ups.com/track?loc=en_US&tracknum=${tn}`;
  if (carrierCode === "fedex" || carrierCode === "fed ex") return `https://www.fedex.com/fedextrack/?tracknumbers=${tn}`;
  if (carrierCode === "auspost" || carrierCode === "australia post") return `https://auspost.com.au/mypost/track/#/details/${tn}`;
  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { orderId, carrier, trackingNumber } = (req.body || {}) as {
      orderId?: string;
      carrier?: string;
      trackingNumber?: string;
    };

    if (!orderId || !carrier || !trackingNumber) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const trackingUrl = buildTrackingUrl(String(carrier), String(trackingNumber));

    await adminDb.collection("orders").doc(String(orderId)).set(
      {
        status: "Shipped",
        updatedAt: FieldValue.serverTimestamp(),
        shipping: {
          carrier: String(carrier),
          carrierCode: String(carrier).toLowerCase(),
          trackingNumber: String(trackingNumber),
          trackingUrl,
          status: "shipped",
          updatedAt: FieldValue.serverTimestamp(),
        },
        fulfillment: {
          stage: "SHIPPED",
          shippedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("updateTracking error", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
