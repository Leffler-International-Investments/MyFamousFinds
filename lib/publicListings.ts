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

function toPublic(id: string, x: any): PublicListing {
  const category = normCategory(x?.category ?? x?.categoryLabel ?? x?.categoryName ?? x?.menuCategory);
  const status = (x?.status ?? x?.moderationStatus ?? "").toString();
  const isSold = x?.isSold === true || isSoldStatus(status) || x?.sold === true;

  return {
    id,
    title: (x?.title ?? x?.name ?? x?.listingTitle ?? "Untitled").toString(),
    brand: (x?.brand ?? x?.designer ?? x?.designerName ?? x?.brandName ?? "").toString(),
    price: pickPrice(x),
    priceUsd: typeof x?.priceUsd === "number" ? x.priceUsd : undefined,
    currency: (x?.currency ?? "USD").toString(),
    category,
    condition: (x?.condition ?? x?.conditionLabel ?? x?.itemCondition ?? "").toString(),
    status,
    isSold,
    images: Array.isArray(x?.images)
      ? x.images
      : Array.isArray(x?.imageUrls)
      ? x.imageUrls
      : [],
    createdAt: x?.createdAt ?? x?.created_at ?? x?.created,
  };
}

async function safeGetDocs(qy: any) {
  try {
    return await getDocs(qy);
  } catch {
    return null;
  }
}

/**
 * Tolerant public loader:
 * - Works even if createdAt is missing
 * - Works even if where+orderBy index is missing
 * - Filters OUT sold and non-live
 */
export async function getPublicListings(opts?: { category?: string; max?: number }): Promise<PublicListing[]> {
  const max = Math.min(Math.max(opts?.max ?? 200, 1), 500);
  const cat = normCategory(opts?.category);
  const base = collection(db, "listings");

  let snap: any = null;

  // 1) best: category + createdAt
  if (cat) {
    snap = await safeGetDocs(query(base, where("category", "==", cat), orderBy("createdAt", "desc"), limit(max)));
    // 2) fallback: category only (no createdAt dependency)
    if (!snap) snap = await safeGetDocs(query(base, where("category", "==", cat), limit(max)));
  }

  // 3) fallback: createdAt only (no composite index)
  if (!snap) snap = await safeGetDocs(query(base, orderBy("createdAt", "desc"), limit(max)));

  // 4) ultimate fallback: plain limit (always works)
  if (!snap) snap = await safeGetDocs(query(base, limit(max)));

  const docs = snap ? snap.docs : [];
  const all = docs.map((d: any) => toPublic(d.id, d.data()));

  const filtered = all
    .filter((l) => {
      const c = normCategory(l.category);
      if (cat && c !== cat) return false;
      if (l.isSold) return false;
      if (!isLiveStatus(l.status)) return false;
      return true;
    })
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  return filtered;
}
