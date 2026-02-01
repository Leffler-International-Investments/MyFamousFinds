// FILE: /lib/publicListings.ts
// Public listings loader (safe for BOTH server + browser).
// IMPORTANT: Uses firebaseClient (NOT firebaseAdmin), because pages can call this on the client.

import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebaseClient";

export type PublicListing = {
  id: string;
  title?: string;
  brand?: string;
  designer?: string;
  price?: number | string;
  currency?: string;

  category?: string;
  condition?: string;

  images?: string[];
  imageUrls?: string[];
  image_url?: string;
  imageUrl?: string;
  mainImageUrl?: string;
  coverImageUrl?: string;
  thumbnailUrl?: string;

  status?: string;
  sold?: boolean;
  isSold?: boolean;
  soldAt?: any;

  createdAt?: any;
  updatedAt?: any;

  [key: string]: any;
};

const CANON = new Set(["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"]);

function normCategory(v: any): string {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "";

  // common variants / typos
  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";

  // Jewelry variants + common typo
  if (s === "JEWELLERY" || s === "JEWELERY" || s === "JEWELRY") return "JEWELRY";

  return s;
}

function normalizeSlug(slug: string): string {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return "";

  if (s === "new-arrivals" || s === "catalogue") return "";

  if (s === "women") return "WOMEN";
  if (s === "bags") return "BAGS";
  if (s === "men" || s === "mens") return "MEN";
  if (s === "jewelry" || s === "jewellery") return "JEWELRY";
  if (s === "watches" || s === "watch") return "WATCHES";

  // allow already-normalized values too
  return normCategory(s);
}

function pickBestImage(l: any): string {
  const single =
    l.image_url ||
    l.imageUrl ||
    l.mainImageUrl ||
    l.coverImageUrl ||
    l.thumbnailUrl ||
    l.image;

  if (typeof single === "string" && single.trim()) return single.trim();

  const arr =
    (Array.isArray(l.images) && l.images) ||
    (Array.isArray(l.imageUrls) && l.imageUrls) ||
    (Array.isArray(l.image_urls) && l.image_urls) ||
    (Array.isArray(l.photos) && l.photos) ||
    (Array.isArray(l.photoUrls) && l.photoUrls) ||
    [];

  if (arr.length > 0 && typeof arr[0] === "string") return String(arr[0]).trim();
  return "";
}

function isSold(l: any): boolean {
  return Boolean(l?.isSold || l?.sold || l?.soldAt);
}

function isPublicStatus(l: any): boolean {
  const s = String(l?.status ?? "").trim().toLowerCase();

  // IMPORTANT: we allow missing status + pending during your migration/testing
  if (!s) return true;

  // allow common "live" statuses
  if (["approved", "published", "live", "active", "listed", "pending"].includes(s)) return true;

  return false;
}

function extractCategory(l: any): string {
  const raw =
    l.category ??
    l.categorySlug ??
    l.menuCategory ??
    l.menu_category ??
    l.productCategory ??
    l.department ??
    l.meta?.category ??
    l.item?.category ??
    "";

  return normCategory(raw);
}

function pickPrice(l: any): number {
  const p = l?.priceUsd ?? l?.price ?? l?.pricing?.amount ?? 0;
  if (typeof p === "number") return Number.isFinite(p) ? p : 0;
  if (typeof p === "string") {
    const n = Number(p.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function getPublicListings(opts?: {
  category?: string;
  take?: number;
}): Promise<PublicListing[]> {
  const take = Math.max(1, Math.min(1000, Number(opts?.take ?? 200)));
  const want = normalizeSlug(opts?.category ?? "");

  const col = collection(db, "listings");
  const q = query(col, orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(q);

  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

  const normalized = all
    .filter((l) => isPublicStatus(l))
    .filter((l) => !isSold(l))
    .map((l) => {
      const cat = extractCategory(l);
      const img = pickBestImage(l);

      return {
        ...l,
        id: l.id,
        category: cat,
        imageUrl: img,
        price: pickPrice(l),
      } as PublicListing;
    });

  // Apply category filter safely
  if (want && CANON.has(want)) {
    return normalized.filter((l) => normCategory(l.category) === want);
  }

  return normalized;
}
