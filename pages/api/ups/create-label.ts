// FILE: /pages/api/ups/create-label.ts
// Creates a UPS shipment and returns tracking number + shipping label.
// Requires seller auth — never expose label generation publicly.
//
// POST /api/ups/create-label
//   Body: { seller, buyer, pkg, serviceCode? }
//   Returns: { ok, trackingNumber, labelBase64, labelFormat }

import type { NextApiRequest, NextApiResponse } from "next";
import {
  createShippingLabel,
  type CreateLabelParams,
} from "../../../lib/ups";
import { getSellerId } from "../../../utils/authServer";

type SuccessResponse = {
  ok: true;
  trackingNumber: string;
  labelBase64: string;
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

  // Require authenticated seller
  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { seller, buyer, pkg, serviceCode } = (req.body || {}) as Partial<CreateLabelParams>;

    // Validate required fields
    if (!seller?.name || !seller?.address1 || !seller?.city || !seller?.state || !seller?.zip) {
      return res.status(400).json({ ok: false, error: "Missing or incomplete seller address" });
    }
    if (!buyer?.name || !buyer?.address1 || !buyer?.city || !buyer?.state || !buyer?.zip) {
      return res.status(400).json({ ok: false, error: "Missing or incomplete buyer address" });
    }
    if (!pkg?.weightLbs || !pkg?.lengthIn || !pkg?.widthIn || !pkg?.heightIn) {
      return res.status(400).json({ ok: false, error: "Missing or incomplete package dimensions/weight" });
    }

    const result = await createShippingLabel({
      seller: {
        name: seller.name,
        phone: seller.phone || "",
        address1: seller.address1,
        address2: seller.address2 || "",
        city: seller.city,
        state: seller.state,
        zip: seller.zip,
        country: seller.country || "US",
      },
      buyer: {
        name: buyer.name,
        phone: buyer.phone || "",
        address1: buyer.address1,
        address2: buyer.address2 || "",
        city: buyer.city,
        state: buyer.state,
        zip: buyer.zip,
        country: buyer.country || "US",
      },
      pkg: {
        weightLbs: pkg.weightLbs,
        lengthIn: pkg.lengthIn,
        widthIn: pkg.widthIn,
        heightIn: pkg.heightIn,
      },
      serviceCode: serviceCode || "03",
    });

    return res.status(200).json({
      ok: true,
      trackingNumber: result.trackingNumber,
      labelBase64: result.labelBase64,
      labelFormat: result.labelFormat,
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "UPS label creation error");
    console.error("[ups/create-label] Error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
