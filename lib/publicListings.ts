// FILE: /lib/publicListings.ts

import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
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
  if (s === "JEWELRY" || s === "JEWELLERY") return "JEWELRY";
  if (CANON.includes(s as any)) return s as CanonCategory;
  return "";
}

function isLiveStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  // ✅ tolerate missing status (treat as live) — IMPORTANT for migrations
  if (!s) return true;
  // During build/test, allow "pending" so freshly uploaded items are visible.
  // When you are ready for strict moderation, remove "pending" from this list.
  return (
    s === "live" ||
    s === "published" ||
    s === "active" ||
    s === "approved" ||
    s === "pending"
  );
}

function isSoldStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  return s === "sold" || s === "inactive_sold";
}

function pickPrice(x: any): number | undefined {
  if (typeof x?.priceUsd === "number") return x.priceUsd;
  if (typeof x?.price === "number") return x.price;

  // tolerate price stored as string
  if (typeof x?.priceUsd === "string") {
    const n = Number(String(x.priceUsd).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  if (typeof x?.price === "string") {
    const n = Number(String(x.price).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }

  // tolerate nested pricing shape
  if (typeof x?.pricing?.amount === "number") return x.pricing.amount;
  if (typeof x?.pricing?.amount === "string") {
    const n = Number(String(x.pricing.amount).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) return n;
  }

  return undefined;
}

function extractImages(x: any): string[] {
  // Prefer explicit arrays if present
  const arr =
    Array.isArray(x?.images) ? x.images :
    Array.isArray(x?.imageUrls) ? x.imageUrls :
    Array.isArray(x?.image_urls) ? x.image_urls :
    Array.isArray(x?.photos) ? x.photos :
    Array.isArray(x?.photoUrls) ? x.photoUrls :
    Array.isArray(x?.photo_urls) ? x.photo_urls :
    [];

  const out: string[] = [];

  // 1) Array-based
  for (const u of arr) {
    if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
  }

  // 2) Single URL fields (common in this codebase: image_url)
  const singles = [
    x?.image_url,
    x?.imageUrl,
    x?.mainImage,
    x?.mainImageUrl,
    x?.thumbnail,
    x?.thumbnailUrl,
    x?.coverImage,
    x?.coverImageUrl,
    // nested item payloads (bulk + older docs)
    x?.item?.image_url,
    x?.item?.imageUrl,
    x?.item?.mainImageUrl,
    x?.item?.thumbnailUrl,
  ];

  for (const u of singles) {
    if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
  }

  // 3) Fallback to proof photos if no public image exists (keeps cards from being blank)
  if (out.length === 0) {
    const proof = Array.isArray(x?.auth_photos)
      ? x.auth_photos
      : Array.isArray(x?.item?.auth_photos)
      ? x.item.auth_photos
      : [];

    for (const u of proof) {
      if (typeof u === "string" && u.trim().length > 0) out.push(u.trim());
    }
  }

  // De-dupe while keeping order
  return Array.from(new Set(out));
}

function extractCategory(x: any): CanonCategory | "" {
  return normCategory(
    x?.category ??
      x?.categoryLabel ??
      x?.categoryName ??
      x?.menuCategory ??
      x?.menu_category ??
      x?.category_name ??
      // nested item payloads (older/imported docs)
      x?.item?.category ??
      x?.item?.categoryLabel ??
      x?.item?.categoryName ??
      x?.item?.menuCategory ??
      x?.item?.menu_category ??
      x?.item?.category_name
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

    const cat = extractCategory(d);
    const imgs = extractImages(d);

    // Live filter
    if (!isLiveStatus(d?.status)) return;

    // Sold filter
    if (isSoldFlag(d)) return;

    const price = pickPrice(d);

    items.push({
      id: doc.id,
      title: String(d?.title || d?.name || "Untitled"),
      brand: String(d?.brand || d?.designer || d?.maker || "").trim() || undefined,
      price: typeof price === "number" ? price : undefined,
      currency: String(d?.currency || d?.pricing?.currency || "USD"),
      category: cat || undefined,
      condition: String(d?.condition || "").trim() || undefined,
      status: String(d?.status || "").trim() || undefined,
      isSold: false,
      images: imgs,
      createdAt: d?.createdAt,
    });
  });

  // Optional category filter at the end (safe, normalized)
  const wanted = normCategory(opts?.category);
  const filtered = wanted ? items.filter((x) => normCategory(x.category) === wanted) : items;

  return filtered;
}
