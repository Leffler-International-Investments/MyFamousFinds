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

  // ✅ IMPORTANT: tolerate common misspellings/variants so Jewelry actually shows
  if (
    s === "JEWELRY" ||
    s === "JEWELLERY" ||
    s === "JEWELERY" ||
    s === "JEWELS" ||
    s === "JEWEL"
  )
    return "JEWELRY";

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
  const a =
    x?.images ??
    x?.imageUrls ??
    x?.image_urls ??
    x?.photos ??
    x?.photoUrls ??
    x?.photo_urls ??
    x?.item?.images ??
    x?.item?.imageUrls ??
    x?.item?.image_urls ??
    x?.item?.photos ??
    x?.item?.photoUrls ??
    x?.item?.photo_urls;

  if (Array.isArray(a)) return a.filter(Boolean).map(String);

  if (typeof x?.image === "string" && x.image) return [x.image];
  if (typeof x?.coverImage === "string" && x.coverImage) return [x.coverImage];
  if (typeof x?.item?.image === "string" && x.item.image) return [x.item.image];
  if (typeof x?.item?.coverImage === "string" && x.item.coverImage)
    return [x.item.coverImage];

  return [];
}

function extractCategory(x: any): string {
  return String(
    x?.category ??
      x?.menuCategory ??
      x?.menu_category ??
      x?.categoryName ??
      x?.category_name ??
      // nested item payloads (older/imported docs)
      x?.item?.category ??
      x?.item?.categoryLabel ??
      x?.item?.categoryName ??
      x?.item?.menuCategory ??
      x?.item?.menu_category ??
      x?.item?.category_name ??
      ""
  ).trim();
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
