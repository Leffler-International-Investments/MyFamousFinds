// FILE: /pages/api/sell.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { getSellerId } from "../../utils/authServer";

type SellResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SellResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const sellerId = getSellerId(req);
    if (!sellerId) {
      return res
        .status(401)
        .json({ ok: false, error: "unauthorized" });
    }

    const body = (req.body || {}) as any;
    const {
      title,
      brand,
      category,
      condition,
      size,
      color,
      price,
      currency,
      image,
      description,
      purchase_source,
      purchase_proof,
      serial_number,
      auth_photos,
    } = body;

    if (!title || !price) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_title_or_price" });
    }

    if (!purchase_source || !purchase_proof) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_authenticity_fields" });
    }

    const numericPrice =
      typeof price === "number"
        ? price
        : Number(String(price).replace(/[^0-9.]/g, "")) || 0;

    const doc = {
      sellerId,
      title: String(title),
      brand: brand ? String(brand) : "",
      category: category ? String(category).toLowerCase() : "",
      condition: condition ? String(condition) : "",
      size: size ? String(size) : "",
      color: color ? String(color) : "",
      price: numericPrice,
      currency: currency || "AUD",
      imageUrl: image ? String(image) : "",
      description: description ? String(description) : "",
      purchase_source: purchase_source ? String(purchase_source) : "",
      purchase_proof: purchase_proof ? String(purchase_proof) : "",
      serial_number: serial_number ? String(serial_number) : "",
      auth_photos: auth_photos ? String(auth_photos) : "",
      status: "PendingReview" as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await adminDb.collection("listings").add(doc);

    return res.status(201).json({ ok: true, id: ref.id });
  } catch (err: any) {
    console.error("sell_api_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
