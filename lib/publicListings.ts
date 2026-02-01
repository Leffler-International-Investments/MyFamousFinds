// FILE: /lib/publicListings.ts
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebaseClient"; // adjust if your path differs

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
  if (s === "MAN" || s === "MEN") return "MEN";
  if (s === "JEWELRY" || s === "JEWELLERY") return "JEWELRY";
  if (CANON.includes(s as any)) return s as CanonCategory;
  return "";
}

function isLiveStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  // accept all common variants
  return s === "live" || s === "published" || s === "active" || s === "approved";
}

function isSoldStatus(v: any): boolean {
  const s = String(v || "").trim().toLowerCase();
  return s === "sold" || s === "inactive_sold";
}

function pickPrice(x: any): number | undefined {
  if (typeof x?.priceUsd === "number") return x.priceUsd;
  if (typeof x?.price === "number") return x.price;
  return undefined;
}

function toPublic(id: string, x: any): PublicListing {
  const category = normCategory(x?.category ?? x?.menuCategory);
  const status = (x?.status ?? x?.moderationStatus ?? "").toString();
  const isSold =
    x?.isSold === true || isSoldStatus(status) || x?.sold === true;

  return {
    id,
    title: (x?.title ?? x?.name ?? x?.listingTitle ?? "Untitled").toString(),
    brand: (x?.brand ?? x?.designer ?? "").toString(),
    price: pickPrice(x),
    priceUsd: typeof x?.priceUsd === "number" ? x.priceUsd : undefined,
    currency: (x?.currency ?? "USD").toString(),
    category,
    condition: (x?.condition ?? "").toString(),
    status: status,
    isSold,
    images: Array.isArray(x?.images) ? x.images : Array.isArray(x?.imageUrls) ? x.imageUrls : [],
    createdAt: x?.createdAt,
  };
}

/**
 * Fetch public listings.
 * - If category is provided, filters by canonical category.
 * - Filters OUT sold.
 * - Filters IN live-ish statuses (live/published/active/approved).
 */
export async function getPublicListings(opts?: {
  category?: string;
  max?: number;
}): Promise<PublicListing[]> {
  const max = Math.min(Math.max(opts?.max ?? 200, 1), 500);
  const cat = normCategory(opts?.category);

  // Try a Firestore query that matches your likely structure,
  // but keep it tolerant: if some docs don't have fields, we post-filter.
  const base = collection(db, "listings");

  let qy = query(base, orderBy("createdAt", "desc"), limit(max));

  // If your docs definitely have "category" field, keep this.
  // If some docs lack category, Firestore where() would exclude them anyway.
  if (cat) {
    qy = query(base, where("category", "==", cat), orderBy("createdAt", "desc"), limit(max));
  }

  const snap = await getDocs(qy);

  const all = snap.docs.map((d) => toPublic(d.id, d.data()));

  // Strong post-filter to guarantee correct behavior
  const filtered = all.filter((l) => {
    const c = normCategory(l.category);
    if (cat && c !== cat) return false;
    if (l.isSold) return false;
    if (!isLiveStatus(l.status)) return false;
    return true;
  });

  return filtered;
}
