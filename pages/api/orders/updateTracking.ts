// FILE: /pages/api/orders/updateTracking.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Data =
  | { ok: true }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const { orderId, carrier, trackingNumber } = req.body || {};

    if (!orderId || !carrier || !trackingNumber) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const carrierCode = String(carrier).toLowerCase();

    let trackingUrl = "";
    if (carrierCode === "dhl") {
      trackingUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(
        trackingNumber
      )}`;
    } else if (carrierCode === "ups") {
      trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(
        trackingNumber
      )}`;
    } else if (carrierCode === "fedex") {
      trackingUrl = `https://www.fedex.com/fedextrack/?tracknumbers=${encodeURIComponent(
        trackingNumber
      )}`;
    }

    await adminDb
      .collection("orders")
      .doc(String(orderId))
      .set(
        {
          shipping: {
            carrier,
            carrierCode,
            trackingNumber,
            trackingUrl,
            status: "shipped",
            lastUpdated: new Date(),
          },
        },
        { merge: true }
      );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("updateTracking error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
