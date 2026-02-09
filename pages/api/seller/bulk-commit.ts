// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getSellerId } from "../../../utils/authServer";
import sharp from "sharp";
import {
  createWhiteDisplayImage,
  hasStorageBucket,
  parseDataUrl,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

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
  imageUrl?: string | null;
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

async function processImage(base64Str: string): Promise<string | null> {
  try {
    const match = base64Str.match(/^data:image\/([a-zA-Z]*);base64,([^"]*)/);
    const rawBase64 = match ? match[2] : base64Str;
    const buffer = Buffer.from(rawBase64, "base64");

    const optimizedBuffer = await sharp(buffer)
      .rotate()
      .modulate({ brightness: 1.1, saturation: 1.05 })
      .resize(1080, 1080, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .toFormat("jpeg", { quality: 85, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Image processing failed:", error);
    return null;
  }
}

async function processAndStoreImage(base64Str: string) {
  const parsed = parseDataUrl(base64Str);
  if (!parsed) return null;

  if (!hasStorageBucket()) {
    const displayBuffer = await createWhiteDisplayImage(parsed.buffer, parsed.contentType);
    return {
      originalUrl: base64Str,
      displayUrl: `data:image/jpeg;base64,${displayBuffer.toString("base64")}`,
    };
  }

  try {
    const stored = await storeListingImages(parsed, "listing-images");
    return { originalUrl: stored.originalUrl, displayUrl: stored.displayUrl };
  } catch (error) {
    console.warn("Storage upload failed, falling back to data URLs:", error);
    const displayBuffer = await createWhiteDisplayImage(parsed.buffer, parsed.contentType);
    return {
      originalUrl: base64Str,
      displayUrl: `data:image/jpeg;base64,${displayBuffer.toString("base64")}`,
    };
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
    category: cat || "",
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
  });

  return set;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk | ApiErr>) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

    const { rows } = (req.body || {}) as { rows?: IncomingRow[] };
    if (!Array.isArray(rows)) return res.status(400).json({ ok: false, error: "Body must include array 'rows'" });

    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

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

      if (cleaned.image_url) {
        const stored = await processAndStoreImage(cleaned.image_url);
        if (stored) {
          cleaned.image_url = stored.originalUrl;
          cleaned.imageUrl = stored.originalUrl;
          cleaned.displayImageUrl = stored.displayUrl;
        } else {
          cleaned.image_url = await processImage(cleaned.image_url);
        }
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
