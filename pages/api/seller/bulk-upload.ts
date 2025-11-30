import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type CsvRow = {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  price?: string;
  source?: string;
  proof?: string;
  serial?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { rows } = req.body as { rows?: CsvRow[] };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "No rows supplied" });
  }

  try {
    const batch = adminDb.batch();

    rows.forEach((row) => {
      const ref = adminDb.collection("listings").doc();

      const priceNumber = parseFloat(row.price || "0");
      const safePrice = Number.isFinite(priceNumber) ? priceNumber : 0;

      batch.set(ref, {
        title: (row.title || "").trim() || "Untitled listing",
        brand: (row.brand || "").trim(),
        designer: (row.brand || "").trim(),
        category: (row.category || "").trim(),
        condition: (row.condition || "").trim(),
        size: (row.size || "").trim(),
        color: (row.color || "").trim(),
        price: safePrice,
        purchase_source: (row.source || "").trim(),
        purchase_proof: (row.proof || "").trim(),
        serial_number: (row.serial || "").trim(),
        status: "Pending",
        createdAt: new Date(),
        source: "bulk-upload-csv",
      });
    });

    await batch.commit();

    return res.status(200).json({
      ok: true,
      count: rows.length,
      message: `Created ${rows.length} pending listings in the review queue.`,
    });
  } catch (err: any) {
    console.error("Bulk upload failed", err);
    return res
      .status(500)
      .json({ error: err?.message || "Bulk upload failed" });
  }
}
