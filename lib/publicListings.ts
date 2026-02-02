// FILE: /lib/publicListings.ts

import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebaseClient";

export type PublicListing = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  priceUsd?: number;
  currency?: string;
  category?: string;
  condition?: string;
  status?: string;
  isSold?: boolean;
  images?: string[];
  createdAt?: any;
};

const CANON = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;
type CanonCategory = (typeof CANON)[number];

function normCategory(v: any): CanonCategory | "" {
  const s = String(v || "").trim().toUpperCase();
  if (s === "WATCH" || s === "WATCHES") return "WATCHES";
  if (s === "WOMAN" || s === "WOMEN") return "WOMEN";
  if (s === "BAG" || s === "BAGS") return "BAGS";
  if (s === "MAN" || s === "MEN" || s === "MENS") return "MEN";

  // tolerate common variants/misspellings
  if (
    s === "JEWELRY" ||
    s === "JEWELLERY" ||
    s === "JEWELERY" ||
    s === "JEWELS" ||
    s === "JEWEL"
  )
    return "JEWELRY";

  if ((CANON as readonly string[]).includes(s)) return s as CanonCategory;
  return "";
}

function isLiveStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return true;
  return (
    s === "live" ||
    s === "published" ||
    s === "active" ||
    s === "approved" ||
    s === "pending" ||
    s === "Pending".toLowerCase()
  );
}

function isSoldStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  return s === "sold" || s === "inactive_sold";
}

function pickPrice(x: any): number | undefined {
  if (typeof x?.priceUsd === "number") return x.priceUsd;
  if (typeof x?.price === "number") return x.price;

  if (typeof x?.priceUsd === "string") {
    const n = Number(String(x.priceUsd).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  if (typeof x?.price === "string") {
    const n = Number(String(x.price).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }

  if (typeof x?.pricing?.amount === "number") return x.pricing.amount;
  if (typeof x?.pricing?.amount === "string") {
    const n = Number(String(x.pricing.amount).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }

  return undefined;
}

// ✅ FIX #1: restore FULL image extraction (includes image_url)
function extractImages(x: any): string[] {
  const arr =
    Array.isArray(x?.images)
      ? x.images
      : Array.isArray(x?.imageUrls)
      ? x.imageUrls
      : Array.isArray(x?.image_urls)
      ? x.image_urls
      : Array.isArray(x?.photos)
      ? x.photos
      : Array.isArray(x?.photoUrls)
      ? x.photoUrls
      : Array.isArray(x?.photo_urls)
      ? x.photo_urls
      : Array.isArray(x?.item?.images)
      ? x.item.images
      : Array.isArray(x?.item?.imageUrls)
      ? x.item.imageUrls
      : Array.isArray(x?.item?.image_urls)
      ? x.item.image_urls
      : Array.isArray(x?.item?.photos)
      ? x.item.photos
      : Array.isArray(x?.item?.photoUrls)
      ? x.item.photoUrls
      : Array.isArray(x?.item?.photo_urls)
      ? x.item.photo_urls
      : [];

  const out: string[] = [];

  for (const u of arr) {
    if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
  }

  const singles = [
    // common in your codebase
    x?.image_url,
    x?.imageUrl,
    x?.image,
    x?.mainImage,
    x?.mainImageUrl,
    x?.thumbnail,
    x?.thumbnailUrl,
    x?.coverImage,
    x?.coverImageUrl,

    // nested bulk/legacy
    x?.item?.image_url,
    x?.item?.imageUrl,
    x?.item?.image,
    x?.item?.mainImageUrl,
    x?.item?.thumbnailUrl,
    x?.item?.coverImageUrl,
  ];

  for (const u of singles) {
    if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
  }

  // last resort: auth/proof photos (prevents blank cards)
  if (out.length === 0) {
    const proof =
      Array.isArray(x?.auth_photos) ? x.auth_photos :
      Array.isArray(x?.authPhotos) ? x.authPhotos :
      Array.isArray(x?.proofPhotos) ? x.proofPhotos :
      Array.isArray(x?.item?.auth_photos) ? x.item.auth_photos :
      Array.isArray(x?.item?.authPhotos) ? x.item.authPhotos :
      Array.isArray(x?.item?.proofPhotos) ? x.item.proofPhotos :
      [];
    for (const u of proof) {
      if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
    }
  }

  // de-dupe
  return Array.from(new Set(out));
}

function firstNonEmpty(...vals: any[]): string {
  for (const v of vals) {
    if (Array.isArray(v)) {
      const s = v.map((x) => String(x || "").trim()).find((x) => x);
      if (s) return s;
    } else {
      const s = String(v || "").trim();
      if (s) return s;
    }
  }
  return "";
}

// ✅ FIX #2: category extraction must prefer legacy fields over `category`
// because you still have conflicting fields on some docs
function extractCategory(x: any): string {
  return firstNonEmpty(
    x?.categoryLabel,
    x?.categoryName,
    x?.menuCategory,
    x?.menuCategories,
    x?.category_name,

    // nested item payloads
    x?.item?.categoryLabel,
    x?.item?.categoryName,
    x?.item?.menuCategory,
    x?.item?.menuCategories,
    x?.item?.category_name,

    // category LAST (only if nothing else exists)
    x?.category,
    x?.item?.category
  );
}

function isSoldFlag(x: any): boolean {
  if (x?.isSold === true) return true;
  if (x?.sold === true) return true;
  if (x?.status && isSoldStatus(x.status)) return true;
  return false;
}

export async function getPublicListings(opts?: {
  category?: string;
  take?: number;
}): Promise<PublicListing[]> {
  const take = Math.min(Math.max(opts?.take ?? 200, 1), 500);

  const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(q);

  const items: PublicListing[] = [];

  snap.forEach((doc) => {
    const d: any = doc.data() || {};

    if (!isLiveStatus(d?.status)) return;
    if (isSoldFlag(d)) return;

    const categoryRaw = extractCategory(d);
    const images = extractImages(d);
    const price = pickPrice(d);

    items.push({
      id: doc.id,
      title: String(d?.title || d?.name || "Untitled"),
      brand: String(d?.brand || d?.designer || d?.maker || "").trim() || undefined,
      price: typeof price === "number" ? price : undefined,
      currency: String(d?.currency || d?.pricing?.currency || "USD"),
      category: categoryRaw || undefined,
      condition: String(d?.condition || "").trim() || undefined,
      status: String(d?.status || "").trim() || undefined,
      isSold: false,
      images,
      createdAt: d?.createdAt,
    });
  });

  const wanted = normCategory(opts?.category);
  const filtered = wanted
    ? items.filter((x) => normCategory(x.category) === wanted)
    : items;

  return filtered;
}
