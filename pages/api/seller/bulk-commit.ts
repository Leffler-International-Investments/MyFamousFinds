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
  imageUrls?: string[]; // <-- UPDATED: From singular to plural array
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

    const body = req.body as { rows?: IncomingRow[] } | undefined;
    const rows = Array.isArray(body?.rows) ? body!.rows : [];

    if (!rows.length) {
      return res
        .status(400)
        .json({ ok: false, error: "no_rows" });
    }

    const batch = adminDb.batch();
    let created = 0;

    for (const r of rows) {
      if (!r || !r.title) {
        continue;
      }

      const priceRaw =
        typeof r.price === "number" ? r.price : Number(r.price);
      const numericPrice = isFinite(priceRaw) ? Number(priceRaw) : 0;
      if (!numericPrice) {
        continue;
      }

      const col = adminDb.collection("listings");
      const docRef = r.id ? col.doc(String(r.id)) : col.doc();

      batch.set(docRef, {
        sellerId,
        title: String(r.title),
        brand: r.brand ? String(r.brand) : "",
        category: r.category ? String(r.category).toLowerCase() : "",
        price: numericPrice,
        currency: "AUD",
        status: "PendingReview",
        imageUrls: Array.isArray(r.imageUrls) ? r.imageUrls : [], // <-- UPDATED
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
