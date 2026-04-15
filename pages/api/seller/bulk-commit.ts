// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getAuthUser, getSellerId } from "../../../utils/authServer";
import sharp from "sharp";
import {
  createWhiteDisplayImage,
  hasStorageBucket,
  parseDataUrl,
  storeListingImages,
  storeProofDocument,
} from "../../../utils/listingImageProcessing";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
  maxDuration: 300,
};

type IncomingRow = {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  colorSwatch?: string | null;
  details?: string;
  price?: number | string;
  purchase_source?: string;
  purchase_proof?: string;
  proof_doc_url?: string | null;
  material?: string;
  serial_number?: string;
  allowOffers?: boolean;
  imageDataUrl?: string | null;
  imageDataUrls?: (string | null | undefined)[] | null;
  // Parallel array of pre-processed (white-background) display image URLs.
  // Only used when imageDataUrls contains already-uploaded HTTPS URLs so the
  // server can skip the bg-removal / display-image step it would otherwise do.
  displayImageUrls?: (string | null | undefined)[] | null;
  auth_doc_1_url?: string | null;
  auth_doc_1_type?: string | null;
  auth_doc_2_url?: string | null;
  auth_doc_2_type?: string | null;
  auth_doc_3_url?: string | null;
  auth_doc_3_type?: string | null;
};

type ShipFromAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type CleanRow = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  size: string;
  color: string;
  colorSwatch: string | null;
  details: string;
  purchase_source: string;
  purchase_proof: string;
  proof_doc_url: string | null;
  material: string;
  serial_number: string;
  price: number;
  allowOffers: boolean;
  _source?: "bulk";
  currency: "USD";
  status: "Pending";
  image_url?: string | null;
  imageUrl?: string | null;
  displayImageUrl?: string | null;
  imageUrls?: string[];
  _rawImageDataUrls?: string[];
  _rawDisplayImageUrls?: string[];
  auth_doc_1_url?: string | null;
  auth_doc_1_type?: string | null;
  auth_doc_2_url?: string | null;
  auth_doc_2_type?: string | null;
  auth_doc_3_url?: string | null;
  auth_doc_3_type?: string | null;
};

type ApiOk = { ok: true; created: number; skipped: number };
type ApiErr = { ok: false; error: string };

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
    // No Storage bucket — process display image and store as compressed data URL
    try {
      const displayResult = await createWhiteDisplayImage(parsed.buffer, parsed.contentType);
      const displayUrl = `data:image/jpeg;base64,${displayResult.buffer.toString("base64")}`;
      return { originalUrl: displayUrl, displayUrl };
    } catch (err) {
      console.warn("Display image processing failed (no bucket):", err);
      return null;
    }
  }

  try {
    const stored = await storeListingImages(parsed, "listing-images");
    return { originalUrl: stored.originalUrl, displayUrl: stored.displayUrl };
  } catch (error) {
    console.warn("Storage upload failed, falling back to compressed data URL:", error);
    try {
      const displayResult = await createWhiteDisplayImage(parsed.buffer, parsed.contentType);
      const displayUrl = `data:image/jpeg;base64,${displayResult.buffer.toString("base64")}`;
      return { originalUrl: displayUrl, displayUrl };
    } catch (err) {
      console.warn("Fallback display image processing also failed:", err);
      return null;
    }
  }
}

function cleanRow(r: IncomingRow): CleanRow | null {
  const rawBrand = toStr(r.brand);
  const brand = rawBrand || "Unknown designer";
  const title = toStr(r.title) || (brand ? `${brand} listing` : "Untitled listing");

  const cat = canonCategory(r.category);
  const material = toStr(r.material);
  const condition = toStr(r.condition);
  const size = toStr(r.size);
  const color = toStr(r.color);
  const colorSwatch = (typeof r.colorSwatch === "string" && r.colorSwatch) ? r.colorSwatch : null;
  const details = toStr(r.details);
  const purchase_source = toStr(r.purchase_source);
  const purchase_proof = toStr(r.purchase_proof);
  const proof_doc_url = (typeof r.proof_doc_url === "string" && r.proof_doc_url) ? r.proof_doc_url : null;
  const serial_number = toStr(r.serial_number);
  const price = coercePrice(r.price);

  if (price == null) return null;

  // Collect all image URLs / data URLs (prefer imageDataUrls array, fall
  // back to single).  Strings can be either inline data URLs (legacy /
  // fallback path) or already-uploaded HTTPS URLs from the seller
  // upload-with-processing endpoint.  The processing loop below handles
  // each case.
  const allImageDataUrls: string[] = [];
  if (Array.isArray(r.imageDataUrls) && r.imageDataUrls.length > 0) {
    allImageDataUrls.push(
      ...r.imageDataUrls.filter((v): v is string => typeof v === "string" && v.length > 0),
    );
  } else if (r.imageDataUrl) {
    allImageDataUrls.push(r.imageDataUrl);
  }

  const allDisplayImageUrls: string[] = Array.isArray(r.displayImageUrls)
    ? r.displayImageUrls.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  return {
    title,
    brand,
    category: cat || "",
    material,
    condition,
    size,
    color,
    colorSwatch,
    details,
    purchase_source,
    purchase_proof,
    proof_doc_url,
    serial_number,
    price,
    allowOffers: r.allowOffers !== false,
    _source: "bulk",
    currency: "USD",
    status: "Pending",
    image_url: allImageDataUrls[0] || null,
    _rawImageDataUrls: allImageDataUrls,
    _rawDisplayImageUrls: allDisplayImageUrls,
    // Authentication documents for high-value categories
    auth_doc_1_url: (typeof r.auth_doc_1_url === "string" && r.auth_doc_1_url) ? r.auth_doc_1_url : null,
    auth_doc_1_type: (typeof r.auth_doc_1_type === "string" && r.auth_doc_1_type) ? r.auth_doc_1_type : null,
    auth_doc_2_url: (typeof r.auth_doc_2_url === "string" && r.auth_doc_2_url) ? r.auth_doc_2_url : null,
    auth_doc_2_type: (typeof r.auth_doc_2_type === "string" && r.auth_doc_2_type) ? r.auth_doc_2_type : null,
    auth_doc_3_url: (typeof r.auth_doc_3_url === "string" && r.auth_doc_3_url) ? r.auth_doc_3_url : null,
    auth_doc_3_type: (typeof r.auth_doc_3_type === "string" && r.auth_doc_3_type) ? r.auth_doc_3_type : null,
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
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const { rows, shipFromAddress } = (req.body || {}) as { rows?: IncomingRow[]; shipFromAddress?: ShipFromAddress };
    if (!Array.isArray(rows)) return res.status(400).json({ ok: false, error: "Body must include array 'rows'" });

    const normalizedShipFromAddress = shipFromAddress
      ? {
          addressLine1: toStr(shipFromAddress.addressLine1),
          addressLine2: toStr(shipFromAddress.addressLine2),
          city: toStr(shipFromAddress.city),
          state: toStr(shipFromAddress.state),
          postalCode: toStr(shipFromAddress.postalCode),
          country: toStr(shipFromAddress.country) || "United States",
        }
      : null;

    const sellerId = await getSellerId(req);
    if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

    // ── Require bank details before creating listings ──
    // Use the verified auth email (matching how banking.ts stores the doc)
    // instead of the seller doc ID which may use underscores instead of dots.
    const authUser = await getAuthUser(req);
    const sellerEmail = authUser?.email?.toLowerCase().trim() || (sellerId.includes("@") ? sellerId : sellerId.replace(/_/g, "."));
    const bankingSnap = await adminDb.collection("seller_banking").doc(sellerEmail).get();
    const bankingData: any = bankingSnap.exists ? bankingSnap.data() : null;
    const hasBankDetails = !!(
      bankingData?.bankName && String(bankingData.bankName).trim() &&
      bankingData?.bankRoutingNumber && String(bankingData.bankRoutingNumber).trim() &&
      bankingData?.bankAccountNumber && String(bankingData.bankAccountNumber).trim()
    );

    if (!hasBankDetails) {
      return res.status(400).json({
        ok: false,
        error: "Please complete your bank details before adding listings. Go to Seller Dashboard → Bank Info and enter your bank account information.",
      });
    }

    const approvedDesigners = await getApprovedDesigners();
    const enforceDesigners = approvedDesigners.size > 0;

    const MAX_PER_REQUEST = 500;
    const slice = rows.slice(0, MAX_PER_REQUEST);

    let created = 0;
    let skipped = 0;
    const createdIds: string[] = [];

    const batch = adminDb.batch();

    for (const raw of slice as IncomingRow[]) {
      const cleaned = cleanRow(raw);
      if (!cleaned) {
        skipped++;
        continue;
      }

      // Process all images (supports multiple per listing).  Inputs may be
      // either inline data URLs (legacy path — uploaded via the JSON body)
      // or already-uploaded HTTPS URLs (new path — /api/seller/upload-with-
      // processing ran client-side).  HTTPS URLs are passed through
      // unchanged; data URLs are still decoded, resized and stored here.
      const rawImages = cleaned._rawImageDataUrls || [];
      const rawDisplayImages = cleaned._rawDisplayImageUrls || [];
      const processedOriginals: string[] = [];
      let primaryDisplayUrl: string | null = null;

      for (let imgIdx = 0; imgIdx < rawImages.length; imgIdx++) {
        const imgDataUrl = rawImages[imgIdx];
        if (!imgDataUrl) continue;

        if (!imgDataUrl.startsWith("data:")) {
          // Already uploaded to Cloud Storage — pass the URL through.
          processedOriginals.push(imgDataUrl);
          const matchingDisplay = rawDisplayImages[imgIdx];
          if (!primaryDisplayUrl) {
            primaryDisplayUrl = matchingDisplay || imgDataUrl;
          }
          continue;
        }

        const stored = await processAndStoreImage(imgDataUrl);
        if (stored) {
          processedOriginals.push(stored.originalUrl);
          if (!primaryDisplayUrl) primaryDisplayUrl = stored.displayUrl;
        } else {
          const fallback = await processImage(imgDataUrl);
          if (fallback) processedOriginals.push(fallback);
        }
      }

      if (processedOriginals.length > 0) {
        const primary = processedOriginals[0];
        cleaned.image_url = primary;
        cleaned.imageUrl = primary;
        // Use the processed display image (with background removal) if available; never null it out
        cleaned.displayImageUrl = primaryDisplayUrl || primary;
        cleaned.imageUrls = processedOriginals;
        // Also write `images` array for compatibility with homepage/product page
        (cleaned as any).images = processedOriginals;
      }

      // Upload proof document to Cloud Storage instead of storing base64 inline
      if (cleaned.proof_doc_url && cleaned.proof_doc_url.startsWith("data:")) {
        try {
          const storedProofUrl = await storeProofDocument(cleaned.proof_doc_url);
          // If storeProofDocument returned the same data URL (no bucket), compress it
          // to avoid exceeding Firestore's 1 MB document limit.
          if (storedProofUrl.startsWith("data:image/")) {
            const proofParsed = parseDataUrl(storedProofUrl);
            if (proofParsed && proofParsed.buffer.length > 200_000) {
              const compressed = await sharp(proofParsed.buffer)
                .resize(800, 800, { fit: "inside" })
                .jpeg({ quality: 60, mozjpeg: true })
                .toBuffer();
              cleaned.proof_doc_url = `data:image/jpeg;base64,${compressed.toString("base64")}`;
            } else if (proofParsed) {
              cleaned.proof_doc_url = storedProofUrl;
            } else {
              // Could not parse — drop inline data to avoid exceeding doc limit
              cleaned.proof_doc_url = null;
            }
          } else {
            cleaned.proof_doc_url = storedProofUrl;
          }
        } catch (error) {
          console.warn("Proof document upload failed, compressing inline:", error);
          try {
            if (cleaned.proof_doc_url.startsWith("data:image/")) {
              const proofParsed = parseDataUrl(cleaned.proof_doc_url);
              if (proofParsed) {
                const compressed = await sharp(proofParsed.buffer)
                  .resize(800, 800, { fit: "inside" })
                  .jpeg({ quality: 60, mozjpeg: true })
                  .toBuffer();
                cleaned.proof_doc_url = `data:image/jpeg;base64,${compressed.toString("base64")}`;
              } else {
                cleaned.proof_doc_url = null;
              }
            }
          } catch (compressErr) {
            console.warn("Proof document compression also failed:", compressErr);
            cleaned.proof_doc_url = null;
          }
        }
      }

      // Upload authentication documents to Cloud Storage (same pattern as proof_doc).
      // Already-uploaded HTTPS URLs are left untouched.
      for (const slot of [1, 2, 3] as const) {
        const urlKey = `auth_doc_${slot}_url` as keyof typeof cleaned;
        const docUrl = cleaned[urlKey] as string | null | undefined;
        if (docUrl && typeof docUrl === "string" && docUrl.startsWith("data:")) {
          try {
            const storedUrl = await storeProofDocument(docUrl);
            if (storedUrl.startsWith("data:image/")) {
              const parsed = parseDataUrl(storedUrl);
              if (parsed && parsed.buffer.length > 200_000) {
                const compressed = await sharp(parsed.buffer)
                  .resize(800, 800, { fit: "inside" })
                  .jpeg({ quality: 60, mozjpeg: true })
                  .toBuffer();
                (cleaned as any)[urlKey] = `data:image/jpeg;base64,${compressed.toString("base64")}`;
              } else {
                (cleaned as any)[urlKey] = storedUrl;
              }
            } else {
              (cleaned as any)[urlKey] = storedUrl;
            }
          } catch (err) {
            console.warn(`auth_doc_${slot} upload failed, dropping inline:`, err);
            (cleaned as any)[urlKey] = null;
          }
        }
      }

      // Remove internal fields before storing
      delete (cleaned as any)._rawImageDataUrls;
      delete (cleaned as any)._rawDisplayImageUrls;

      const brandKey = cleaned.brand.toLowerCase();
      const isApprovedDesigner = enforceDesigners && approvedDesigners.has(brandKey);

      const ref = adminDb.collection("listings").doc();
      createdIds.push(ref.id);

      const docData: any = {
        ...cleaned,
        sellerId,
        designerStatus: isApprovedDesigner ? "approved" : "unlisted",
        pricing: { amount: cleaned.price, currency: "USD" },
        visibility: { public: false, searchable: false },
        vetting: { stage: "intake", by: "bulk-upload", at: FieldValue.serverTimestamp() },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(normalizedShipFromAddress ? { shipFromAddress: normalizedShipFromAddress } : {}),
      };

      // Safety: strip any inline data URLs that would push the doc over
      // Firestore's 1 MB limit. Estimate total JSON size roughly.
      const roughSize = JSON.stringify(docData).length;
      if (roughSize > 900_000) {
        // Drop the heaviest inline fields to fit under the limit
        if (docData.proof_doc_url && docData.proof_doc_url.startsWith("data:")) {
          docData.proof_doc_url = null;
        }
        if (docData.image_url && docData.image_url.startsWith("data:")) {
          docData.image_url = null;
          docData.imageUrl = null;
          docData.displayImageUrl = null;
          docData.imageUrls = [];
        }
        // Strip auth doc inline data URLs
        for (const slot of [1, 2, 3]) {
          const key = `auth_doc_${slot}_url`;
          if (docData[key] && docData[key].startsWith("data:")) {
            docData[key] = null;
          }
        }
      }

      batch.set(ref, docData);
      created++;
    }

    if (created > 0) await batch.commit();

    // Fire background removal for each created listing (fire-and-forget).
    // Uses the same /api/admin/remove-bg/[id] endpoint as the admin "White BG" button.
    const adminSecret = process.env.ADMIN_API_SECRET || "";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    if (adminSecret && baseUrl && createdIds.length > 0) {
      // Don't await — let it run after response is sent
      Promise.all(
        createdIds.map((id) =>
          fetch(`${baseUrl}/api/admin/remove-bg/${id}`, {
            method: "POST",
            headers: { "x-admin-secret": adminSecret },
          }).catch((e) => console.warn(`remove-bg fire-and-forget failed for ${id}:`, e))
        )
      ).catch(() => {});
    }

    return res.status(200).json({ ok: true, created, skipped });
  } catch (err: any) {
    console.error("bulk-commit error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal error" });
  }
}
