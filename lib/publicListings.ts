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
  return s === "live" || s === "published" || s === "active" || s === "approved";
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
  return undefined;
}

function toMillis(createdAt: any): number {
  try {
    if (!createdAt) return 0;
    if (typeof createdAt?.toMillis === "function") return createdAt.toMillis();
    if (typeof createdAt === "number") return createdAt;
    if (typeof createdAt === "string") {
      const t = Date.parse(createdAt);
      return Number.isFinite(t) ? t : 0;
    }
    if (typeof createdAt?.seconds === "number") return createdAt.seconds * 1000;
    return 0;
  } catch {
    return 0;
  }
}

// ✅ find category from multiple possible fields
function extractCategory(x: any): CanonCategory | "" {
  return normCategory(
    x?.category ??
      x?.categoryLabel ??
      x?.categoryName ??
      x?.menuCategory ??
      x?.menu_category ??
      x?.category_name
  );
}

// ✅ find status from multiple possible fields
function extractStatus(x: any): string {
  return String(x?.status ?? x?.moderationStatus ?? x?.listingStatus ?? "").trim();
}

// ✅ find images from multiple possible fields
function extractImages(x: any): string[] {
  const imgs =
    Array.isArray(x?.images) ? x.images :
    Array.isArray(x?.imageUrls) ? x.imageUrls :
    Array.isArray(x?.image_urls) ? x.image_urls :
    Array.isArray(x?.photos) ? x.photos :
    [];
  return imgs.filter((u: any) => typeof u === "string" && u.trim().length > 0);
}

function toPublic(id: string, x: any): PublicListing {
  const category = extractCategory(x);
  const status = extractStatus(x);

  const isSold =
    x?.isSold === true ||
    x?.sold === true ||
    x?.is_sold === true ||
    isSoldStatus(status);

  return {
    id,
    title: String(x?.title ?? x?.name ?? x?.listingTitle ?? "Untitled"),
    brand: String(x?.brand ?? x?.designer ?? x?.designerName ?? x?.brandName ?? ""),
    price: pickPrice(x),
    priceUsd: typeof x?.priceUsd === "number" ? x.priceUsd : undefined,
    currency: String(x?.currency ?? "USD"),
    category,
    condition: String(x?.condition ?? x?.conditionLabel ?? x?.itemCondition ?? ""),
    status,
    isSold,
    images: extractImages(x),
    createdAt: x?.createdAt ?? x?.created_at ?? x?.created ?? x?.timestamp ?? null,
  };
}

async function safeGetDocs(qy: any) {
  try {
    return await getDocs(qy);
  } catch (e) {
    return null;
  }
}

/**
 * Tolerant public loader:
 * - Works even if createdAt is missing
 * - Works even if where+orderBy index is missing
 * - Works even if category isn't stored as exact "WOMEN" in Firestore
 * - Filters OUT sold and non-live (missing status allowed by default)
 */
export async function getPublicListings(opts?: { category?: string; max?: number }): Promise<PublicListing[]> {
  const max = Math.min(Math.max(opts?.max ?? 200, 1), 500);
  const wantedCat = normCategory(opts?.category);
  const base = collection(db, "listings");

  let snap: any = null;

  // Try the "best" query first ONLY if we can reasonably expect it to work.
  // NOTE: We do NOT rely on Firestore "category" equality because your data can vary.
  // Instead we fetch a bigger set and filter in-memory safely.

  // 1) best: orderBy createdAt
  snap = await safeGetDocs(query(base, orderBy("createdAt", "desc"), limit(max)));

  // 2) fallback: plain limit (always works)
  if (!snap) snap = await safeGetDocs(query(base, limit(max)));

  const docs = snap ? snap.docs : [];
  const all = docs.map((d: any) => toPublic(d.id, d.data()));

  // ✅ in-memory filtering is the key fix
  const filtered = all
    .filter((l) => {
      const c = normCategory(l.category);
      if (wantedCat && c !== wantedCat) return false;
      if (l.isSold) return false;
      if (!isLiveStatus(l.status)) return false;
      return true;
    })
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  return filtered;
}
