// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getSellerId } from "../../../utils/authServer";
import { processBase64Image } from "../../../lib/imageProcessing";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

type IncomingRow = {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  price?: number | string;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  imageDataUrl?: string | null;
};

type CleanRow = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  size: string;
  color: string;
  purchase_source: string;
  purchase_proof: string;
  serial_number: string;
  price: number;
  _source?: "bulk";
  currency: "USD";
  status: "Pending";
  image_url?: string | null;
  displayImageUrl?: string | null;
};

type ApiOk = { ok: true; created: number; skipped: number };
type ApiErr = { ok: false; error: string };

const CANON = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;
type Canon = (typeof CANON)[number];

function canonCategory(v: any): Canon | "" {
  const s = String(v || "").trim().toUpperCase();
  if (s === "WATCH" || s === "WATCHES") return "WATCHES";
  if (s === "WOMAN" || s === "WOMEN") return "WOMEN";
  if (s === "BAG" || s === "BAGS") return "BAGS";
  if (s === "MAN" || s === "MEN" || s === "MENS") return "MEN";
  if (s === "JEWELLERY" || s === "JEWELRY") return "JEWELRY";
  if ((CANON as readonly string[]).includes(s)) return s as Canon;
  return "";
}

function isFinitePositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}
function toStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}
function coercePrice(v: unknown): number | null {
  if (typeof v === "number") return isFinitePositiveNumber(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return isFinitePositiveNumber(n) ? n : null;
  }
  return null;
}

/**
 * Process image with background removal and white background
 * Returns both original (flattened) and display (bg removed) data URLs
 */
async function processImageWithBgRemoval(
  base64Str: string
): Promise<{ imageUrl: string | null; displayImageUrl: string | null }> {
  try {
    // Process with background removal
    const result = await processBase64Image(base64Str);

    if (result.success && result.processedDataUrl) {
      // Return processed image as both (since we want white bg for display)
      return {
        imageUrl: result.processedDataUrl,
        displayImageUrl: result.processedDataUrl,
      };
    }

    // Fallback: return original as-is
    return { imageUrl: base64Str, displayImageUrl: null };
  } catch (error) {
    console.error("Image processing failed:", error);
    return { imageUrl: base64Str, displayImageUrl: null };
  }
}

function cleanRow(r: IncomingRow): CleanRow | null {
  const rawBrand = toStr(r.brand);
  const brand = rawBrand || "Unknown designer";
  const title = toStr(r.title) || (brand ? `${brand} listing` : "Untitled listing");

  const cat = canonCategory(r.category);
  const condition = toStr(r.condition);
  const size = toStr(r.size);
  const color = toStr(r.color);
  const purchase_source = toStr(r.purchase_source);
  const purchase_proof = toStr(r.purchase_proof);
  const serial_number = toStr(r.serial_number);
  const price = coercePrice(r.price);

  if (price == null) return null;

  return {
    title,
    brand,
    category: cat || "", // ✅ ONE SOURCE OF TRUTH
    condition,
    size,
    color,
    purchase_source,
    purchase_proof,
    serial_number,
    price,
    _source: "bulk",
    currency: "USD",
    status: "Pending",
    image_url: r.imageDataUrl || null,
  };
}

async function getApprovedDesigners(): Promise<Set<string>> {
  const snap = await adminDb.collection("designers").get();
  const set = new Set<string>();
  if (snap.empty) return set;

  snap.forEach((doc) => {
    const data = doc.data() as any;
    if (data && data.name && data.active !== false) {
      set.add(String(data.name).trim().toLowerCase());
    }
    return;
  });

  return set;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk | ApiErr>) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const { rows } = (req.body || {}) as { rows?: IncomingRow[] };
    if (!Array.isArray(rows)) return res.status(400).json({ ok: false, error: "Body must include array 'rows'" });

    const sellerId = getSellerId(req) || "seller-demo-001";

    const approvedDesigners = await getApprovedDesigners();
    const enforceDesigners = approvedDesigners.size > 0;

    const MAX_PER_REQUEST = 500;
    const slice = rows.slice(0, MAX_PER_REQUEST);

    let created = 0;
    let skipped = 0;

    const batch = adminDb.batch();

    for (const raw of slice as IncomingRow[]) {
      const cleaned = cleanRow(raw);
      if (!cleaned) {
        skipped++;
        continue;
      }

      // Process image with background removal
      if (cleaned.image_url) {
        const processed = await processImageWithBgRemoval(cleaned.image_url);
        cleaned.image_url = processed.imageUrl;
        cleaned.displayImageUrl = processed.displayImageUrl;
      }

      const brandKey = cleaned.brand.toLowerCase();
      const isApprovedDesigner = enforceDesigners && approvedDesigners.has(brandKey);

      const ref = adminDb.collection("listings").doc();

      const docData: any = {
        ...cleaned,
        sellerId,
        designerStatus: isApprovedDesigner ? "approved" : "unlisted",
        pricing: { amount: cleaned.price, currency: "USD" },
        visibility: { public: false, searchable: false },
        vetting: { stage: "intake", by: "bulk-upload", at: FieldValue.serverTimestamp() },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(ref, docData);
      created++;
    }

    if (created > 0) await batch.commit();

    return res.status(200).json({ ok: true, created, skipped });
  } catch (err: any) {
    console.error("bulk-commit error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal error" });
  }
}
