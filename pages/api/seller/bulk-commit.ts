// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type IncomingRow = {
  id?: string;
  title?: string;
  brand?: string;
  category?: string;
  price?: string | number;
};

type BulkCommitResponse =
  | { ok: true; created: number }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BulkCommitResponse>
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

    const body = req.body || {};
    const rows = (body.rows || []) as IncomingRow[];

    if (!Array.isArray(rows) || !rows.length) {
      return res
        .status(400)
        .json({ ok: false, error: "no_rows" });
    }

    const batch = adminDb.batch();
    let created = 0;

    for (const r of rows) {
      if (!r.title || r.price === undefined || r.price === null) {
        continue;
      }

      const numericPrice =
        typeof r.price === "number"
          ? r.price
          : Number(String(r.price).replace(/[^0-9.]/g, "")) || 0;

      const docRef = adminDb.collection("listings").doc();
      batch.set(docRef, {
        sellerId,
        title: String(r.title),
        brand: r.brand ? String(r.brand) : "",
        category: r.category ? String(r.category).toLowerCase() : "",
        price: numericPrice,
        currency: "AUD",
        status: "PendingReview",
        imageUrl: "",
        description: "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      created += 1;
    }

    if (!created) {
      return res
        .status(400)
        .json({ ok: false, error: "no_valid_rows" });
    }

    await batch.commit();

    return res.status(200).json({ ok: true, created });
  } catch (err: any) {
    console.error("bulk_commit_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
