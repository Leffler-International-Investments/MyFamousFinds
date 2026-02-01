// FILE: /lib/publicListings.ts
// Single source of truth for PUBLIC listings (used by /catalogue, /category/[slug], /designers, etc.)
// - Loads listings from Firestore (admin SDK)
// - Normalizes fields (title/brand/category/condition/price/image)
// - Excludes non-public items (Pending/Rejected/Sold/etc.)
// - Category filtering via slug + alias mapping
//
// IMPORTANT:
// "When an item is sold it will be removed" => any listing with:
// - status containing "sold", OR
// - sold === true, OR
// - soldAt exists
// is excluded from PUBLIC results.

import { adminDb } from "../utils/firebaseAdmin";

export type PublicListing = {
  id: string;
  title: string;
  brand: string;
  category: string;
  condition: string;
  price: string; // e.g. "US$999"
  priceValue: number;
  image: string;
  href: string; // e.g. /product/<id>
  createdAtMs: number;
  sellerId?: string;
  statusRaw?: string;
};

export type PublicListingsQuery = {
  limit?: number; // default 300
};

const DEFAULT_LIMIT = 300;

// ---------- helpers ----------
function norm(v: any): string {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function slugify(v: any): string {
  return norm(v)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function compact(v: string): string {
  return String(v || "").toLowerCase().replace(/[\s\-']/g, "");
}

function parsePriceToNumber(price: any): number {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  const s = String(price || "").trim();
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatPriceUS(priceValue: number): string {
  if (!priceValue) return "";
  return `US$${priceValue.toLocaleString("en-US")}`;
}

function pickImage(d: any): string {
  return (
    d.image_url ||
    d.imageUrl ||
    d.image ||
    (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
    (Array.isArray(d.photos) && d.photos[0]) ||
    (Array.isArray(d.auth_photos) && d.auth_photos[0]) ||
    ""
  );
}

function pickBrand(d: any): string {
  return (
    d.brand ||
    d.designer ||
    d.designerName ||
    d.brandName ||
    d.maker ||
    ""
  );
}

function pickCondition(d: any): string {
  return (
    d.condition ||
    d.conditionLabel ||
    d.itemCondition ||
    d.conditionText ||
    ""
  );
}

function pickCategory(d: any): string {
  // Choose ONE consistent category field for public display.
  // If your DB already stores "category" correctly, it will win.
  return (
    d.category ||
    d.menuCategory ||
    d.categoryLabel ||
    d.categoryName ||
    d.topCategory ||
    d.mainCategory ||
    d.parentCategory ||
    ""
  );
}

function isSold(d: any): boolean {
  const status = String(d.status || "").trim();
  if (/sold/i.test(status)) return true;
  if (d.sold === true) return true;
  if (d.isSold === true) return true;
  if (d.soldAt) return true;
  return false;
}

function isRejectedOrPending(d: any): boolean {
  const status = String(d.status || "").trim();
  if (/pending/i.test(status)) return true;
  if (/reject/i.test(status)) return true;
  if (/rejected/i.test(status)) return true;
  return false;
}

function isPublicStatus(d: any): boolean {
  // Treat blank/undefined status as public (your management page shows many as "Live" anyway)
  const status = String(d.status || "").trim();
  if (!status) return true;

  // Explicitly public statuses
  if (/^live$/i.test(status)) return true;
  if (/^active$/i.test(status)) return true;
  if (/^approved$/i.test(status)) return true;

  // Anything else is not public unless you add it above
  return false;
}

function createdAtMs(d: any): number {
  const ca = d.createdAt;
  if (!ca) return 0;
  if (typeof ca === "number") return ca;
  if (typeof ca?.toMillis === "function") return ca.toMillis();
  // Firestore Timestamp sometimes has _seconds
  if (typeof ca?._seconds === "number") return ca._seconds * 1000;
  return 0;
}

// Slug aliases for category routes
const CATEGORY_ALIASES: Record<string, string[]> = {
  women: ["women", "womens", "ladies", "lady", "female"],
  men: ["men", "mens", "man's", "man", "male"],
  bags: ["bags", "bag", "handbags", "handbag", "purses", "purse"],
  jewelry: ["jewelry", "jewellery"],
  watches: ["watches", "watch"],
};

// ---------- core normalization ----------
function normalizeListing(docId: string, d: any): PublicListing {
  const title = String(d.title || "Untitled listing");
  const brand = String(pickBrand(d));
  const category = String(pickCategory(d));
  const condition = String(pickCondition(d));
  const priceValue = parsePriceToNumber(d.price);
  const price = formatPriceUS(priceValue);
  const image = pickImage(d);

  return {
    id: docId,
    title,
    brand,
    category,
    condition,
    price,
    priceValue,
    image,
    href: `/product/${docId}`,
    createdAtMs: createdAtMs(d),
    sellerId: d.sellerId || d.seller || undefined,
    statusRaw: d.status || "",
  };
}

// ---------- public API ----------
export async function loadPublicListings(
  opts: PublicListingsQuery = {}
): Promise<PublicListing[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_LIMIT, 1000));

  // Pull newest first if possible; fallback if createdAt missing
  let snap;
  try {
    snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch {
    snap = await adminDb.collection("listings").limit(limit).get();
  }

  const all = snap.docs.map((doc) => normalizeListing(doc.id, doc.data()));

  // Re-fetch raw doc data for status checks (we need sold/pending/rejected/public)
  // (We can’t store the raw doc inside PublicListing because we want a clean return shape)
  const byIdRaw: Record<string, any> = {};
  snap.docs.forEach((doc) => (byIdRaw[doc.id] = doc.data() || {}));

  const publicOnly = all.filter((it) => {
    const raw = byIdRaw[it.id] || {};
    if (isSold(raw)) return false; // ✅ SOLD removed
    if (isRejectedOrPending(raw)) return false;
    if (!isPublicStatus(raw)) return false;
    // Must have category to appear in categories (catalogue may still show without, up to you)
    return true;
  });

  // Ensure newest first even in fallback query
  publicOnly.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  return publicOnly;
}

export async function loadPublicListingsByCategorySlug(
  categorySlug: string,
  opts: PublicListingsQuery = {}
): Promise<PublicListing[]> {
  const wanted = slugify(categorySlug);
  const wantedSlugs = Array.from(
    new Set([wanted, ...(CATEGORY_ALIASES[wanted] || [])].map((s) => slugify(s)))
  );

  const all = await loadPublicListings(opts);

  // Filter by listing.category (single canonical field after normalization)
  const filtered = all.filter((it) => {
    const c = String(it.category || "").trim();
    if (!c) return false;

    const cNorm = norm(c);
    const cSlug = slugify(c);

    if (wantedSlugs.includes(cSlug)) return true;

    // Extra safety for weird spacing/characters
    if (compact(cNorm) === compact(wanted)) return true;

    return false;
  });

  return filtered;
}

export function categorySlugFromLabel(label: string): string {
  return slugify(label);
}
