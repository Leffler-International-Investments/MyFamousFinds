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
  imageUrls?: string[];
  // --- ADDED: New authenticity fields ---
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  auth_photos?: string[];
  authenticity_confirmed?: boolean | string;
  // ------------------------------------
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
    let skipped = 0;

    for (const r of rows) {
      if (!r || !r.title) {
        skipped++;
        continue;
      }

      // --- ADDED: Authenticity check ---
      const confirmed = r.authenticity_confirmed === true || String(r.authenticity_confirmed).toUpperCase() === 'YES';
      if (!r.purchase_source || !r.purchase_proof || !r.serial_number || !confirmed) {
        // Skip rows that are missing mandatory proof or confirmation
        skipped++;
        continue;
      }
      // ---------------------------------

      const priceRaw =
        typeof r.price === "number" ? r.price : Number(r.price);
      const numericPrice = isFinite(priceRaw) ? Number(priceRaw) : 0;
      if (!numericPrice) {
        skipped++;
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
        currency: "USD", // --- SET TO USD ---
        status: "PendingReview", // All uploads go to review
        imageUrls: Array.isArray(r.imageUrls) ? r.imageUrls : [],
        description: "", // Can be added later
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        // --- ADDED: Save new fields to database ---
        purchase_source: String(r.purchase_source),
        purchase_proof: String(r.purchase_proof),
        serial_number: String(r.serial_number),
        auth_photos: Array.isArray(r.auth_photos) ? r.auth_photos : [],
        authenticity_confirmed: true,
        // ------------------------------------------
      });

      created += 1;
    }

    if (!created && skipped > 0) {
      return res
        .status(400)
        .json({ ok: false, error: `No listings created. ${skipped} row(s) were skipped due to missing required authenticity fields (purchase_source, purchase_proof, serial_number, or authenticity_confirmed).` });
    }
    
    if (!created) {
       return res
        .status(400)
        .json({ ok: false, error: "No valid rows provided." });
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
