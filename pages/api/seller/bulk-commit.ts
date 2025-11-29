// FILE: /pages/api/seller/bulk-commit.ts
// Accepts rows from seller bulk upload / bulk-simple and creates
// docs in the "listings" collection.
//
// FEATURES:
// - Sharp Image Processing (Resize, Compress, White Background)
// - 20MB Payload Support
// - Firestore Validation

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getSellerId } from "../../../utils/authServer";
import sharp from "sharp";

// ✅ CONFIG: Allow large uploads (20MB) to prevent 413 errors
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

// ---------- Types ----------
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
};

type ApiOk = { ok: true; created: number; skipped: number };
type ApiErr = { ok: false; error: string };

// ---------- Helpers ----------
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

// ---------- IMAGE ENGINE (Sharp) ----------
async function processImage(base64Str: string): Promise<string | null> {
  try {
    // 1. Strip the "data:image/xyz;base64," prefix if present
    const match = base64Str.match(/^data:image\/([a-zA-Z]*);base64,([^"]*)/);
    const rawBase64 = match ? match[2] : base64Str;
    
    // 2. Convert to Buffer
    const buffer = Buffer.from(rawBase64, "base64");

    // 3. Process with Sharp (The "Luxury Standard")
    // - Rotate: Fixes iPhone sideways photos
    // - Resize: 1080x1080 Square (Industry Standard)
    // - Fit 'contain': Ensures the whole item is visible
    // - Background: White (#ffffff) to fill empty space
    // - Format: JPEG at 80% quality (Visual perfection, low file size)
    const optimizedBuffer = await sharp(buffer)
      .rotate() 
      .resize(1080, 1080, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" }) // Removes transparency
      .toFormat("jpeg", { quality: 80, mozjpeg: true })
      .toBuffer();

    // 4. Return as Data URL
    return `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Image processing failed:", error);
    // If optimization fails, we return null to avoid breaking the listing creation.
    // Alternatively, you could return the original string, but that risks the 1MB limit.
    return null;
  }
}

// ---------- CLEAN ROW ----------
function cleanRow(r: IncomingRow): CleanRow | null {
  const rawBrand = toStr(r.brand);
  const brand = rawBrand || "Unknown designer";

  const title =
    toStr(r.title) || (brand ? `${brand} listing` : "Untitled listing");

  const category = toStr(r.category);
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
    category,
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

// ---------- Approved Designers (flag only) ----------
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

// ---------- Handler ----------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ ok: false, error: "Method not allowed" });
    }

    const { rows } = (req.body || {}) as { rows?: IncomingRow[] };
    if (!Array.isArray(rows)) {
      return res
        .status(400)
        .json({ ok: false, error: "Body must include array 'rows'" });
    }

    const sellerId = getSellerId(req) || "seller-demo-001";

    const approvedDesigners = await getApprovedDesigners();
    const enforceDesigners = approvedDesigners.size > 0;

    const MAX_PER_REQUEST = 500;
    const slice = rows.slice(0, MAX_PER_REQUEST);

    let created = 0;
    let skipped = 0;

    const batch = adminDb.batch();

    // Use a standard for loop to handle async/await correctly
    for (const raw of slice as IncomingRow[]) {
      const cleaned = cleanRow(raw);
      if (!cleaned) {
        skipped++;
        continue;
      }

      // --- 🎨 IMAGE PROCESSING ENGINE ---
      if (cleaned.image_url) {
        // This converts the raw upload into a standardized, compressed PRO image
        // It prevents the "1MB limit" error by compressing efficiently.
        cleaned.image_url = await processImage(cleaned.image_url);
      }
      // ----------------------------------

      const brandKey = cleaned.brand.toLowerCase();
      const isApprovedDesigner =
        enforceDesigners && approvedDesigners.has(brandKey);

      const ref = adminDb.collection("listings").doc();

      const docData: any = {
        ...cleaned,
        sellerId,
        designerStatus: isApprovedDesigner ? "approved" : "unlisted",
        pricing: {
          amount: cleaned.price,
          currency: "USD",
        },
        visibility: {
          public: false,
          searchable: false,
        },
        vetting: {
          stage: "intake",
          by: "bulk-upload",
          at: FieldValue.serverTimestamp(),
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(ref, docData);
      created++;
    }

    if (created > 0) {
      await batch.commit();
    }

    return res.status(200).json({ ok: true, created, skipped });
  } catch (err: any) {
    console.error("bulk-commit error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal error" });
  }
}
