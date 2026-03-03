// FILE: /pages/api/seller/bulk-upload.ts
// Legacy CSV bulk upload endpoint used by /pages/seller/bulk-upload.tsx.
// FIX: Require seller auth so we can stamp sellerId on each listing.
//      Without sellerId the order flow cannot resolve the seller,
//      which breaks UPS label generation and seller notification emails.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getSellerId } from "../../../utils/authServer";

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
  details?: string;
  colorswatch?: string;
  material?: string;
  allowOffers?: boolean;
};

const CANON = ["WOMEN", "BAGS", "MEN", "KIDS", "JEWELRY", "WATCHES"] as const;
type Canon = (typeof CANON)[number];

function canonCategory(v: any): Canon | "" {
  const s = String(v || "").trim().toUpperCase();
  if (s === "WATCH" || s === "WATCHES") return "WATCHES";
  if (s === "WOMAN" || s === "WOMEN") return "WOMEN";
  if (s === "BAG" || s === "BAGS") return "BAGS";
  if (s === "MAN" || s === "MEN" || s === "MENS") return "MEN";
  if (s === "KID" || s === "KIDS" || s === "CHILDREN" || s === "CHILDRENS") return "KIDS";
  if (s === "JEWELLERY" || s === "JEWELRY") return "JEWELRY";
  if ((CANON as readonly string[]).includes(s)) return s as Canon;
  return "";
}

function safeNumber(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  try {
    // FIX: Require seller auth so every listing gets a sellerId
    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    const { rows } = req.body as { rows?: CsvRow[] };
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ ok: false, error: "No rows supplied" });
    }

    const MAX_PER_REQUEST = 500;
    const slice = rows.slice(0, MAX_PER_REQUEST);

    const batch = adminDb.batch();

    slice.forEach((row) => {
      const ref = adminDb.collection("listings").doc();
      const price = safeNumber(row.price);
      const cat = canonCategory(row.category);

      batch.set(ref, {
        // FIX: Tie every listing to the authenticated seller
        sellerId: String(sellerId),

        title: String(row.title || "").trim() || "Untitled listing",
        brand: String(row.brand || "").trim(),
        designer: String(row.brand || "").trim(),

        // ONE SOURCE OF TRUTH
        category: cat || "",

        condition: String(row.condition || "").trim(),
        size: String(row.size || "").trim(),
        color: String(row.color || "").trim(),
        colorSwatch: String(row.colorswatch || "").trim(),
        details: String(row.details || "").trim(),
        material: String(row.material || "").trim(),

        // Legacy purchase fields
        purchase_source: String(row.source || "").trim(),
        purchase_proof: String(row.proof || "").trim(),
        serial_number: String(row.serial || "").trim(),

        allowOffers: row.allowOffers !== false,
        price,
        pricing: { amount: price, currency: "USD" },

        status: "Pending",
        visibility: { public: false, searchable: false },

        source: "bulk-upload-csv",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return res.status(200).json({
      ok: true,
      count: slice.length,
      message: `Created ${slice.length} pending listings in the review queue.`,
    });
  } catch (err: any) {
    console.error("Bulk upload failed", err);
    return res.status(500).json({ ok: false, error: err?.message || "Bulk upload failed" });
  }
}
