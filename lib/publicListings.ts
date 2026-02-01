// FILE: /lib/publicListings.ts
// Single source of truth for PUBLIC listings (category pages, catalogue, new arrivals).
// No firebaseAdmin import. Works on Vercel.

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebaseClient";

export type PublicListing = {
  id: string;
  title?: string;
  brand?: string;
  designer?: string;
  price?: number;
  currency?: string;

  category?: string; // expected: WOMEN | BAGS | MEN | JEWELRY | WATCHES
  condition?: string;

  imageUrl?: string;
  images?: string[];
  imageUrls?: string[];

  status?: string; // "published" etc
  isSold?: boolean;
  sold?: boolean;
  soldAt?: any;

  createdAt?: any;
  updatedAt?: any;

  [key: string]: any;
};

const ALLOWED = new Set(["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"]);

function normCategory(raw: any): string {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();

  // common variants
  if (s === "JEWELLERY") return "JEWELRY";
  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";

  return s;
}

function normalizeSlug(slug: string): string {
  const s = String(slug || "").trim().toLowerCase();

  if (!s) return "";
  if (s === "new-arrivals" || s === "catalogue") return "";
  if (s === "women") return "WOMEN";
  if (s === "bags") return "BAGS";
  if (s === "men") return "MEN";
  if (s === "jewelry" || s === "jewellery") return "JEWELRY";
  if (s === "watches") return "WATCHES";

  // fallback: allow passing already-normalized value
  return normCategory(s);
}

function pickBestImage(l: any): string {
  // try the most common keys in your project
  const fromSingle =
    l.imageUrl ||
    l.primaryImageUrl ||
    l.coverImageUrl ||
    l.mainImageUrl ||
    l.image;

  if (typeof fromSingle === "string" && fromSingle.trim()) return fromSingle.trim();

  const arr =
    l.images ||
    l.imageUrls ||
    l.photos ||
    l.photoUrls ||
    l.gallery ||
    [];

  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
    return String(arr[0]).trim();
  }

  return "";
}

function isPublished(l: any): boolean {
  const status = String(l.status ?? "").toLowerCase();
  // accept published/active/listed — keep permissive
  if (status && !["published", "active", "listed", "live"].includes(status)) return false;
  return true;
}

function isSold(l: any): boolean {
  return Boolean(l.isSold || l.sold || l.soldAt);
}

export async function getPublicListings(opts?: {
  category?: string; // slug or category
  take?: number;
}): Promise<PublicListing[]> {
  const take = Math.max(1, Math.min(1000, Number(opts?.take ?? 200)));
  const wantCategory = normalizeSlug(opts?.category ?? "");

  // Primary collection (this is your live marketplace collection)
  // If your live collection name differs, change ONLY this string.
  const col = collection(db, "listings");

  // Keep query light: only "published" + newest, then filter in JS (handles spelling variants cleanly)
  const q = query(col, orderBy("createdAt", "desc"), limit(take));

  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

  const filtered = all
    .filter(isPublished)
    .filter((l) => !isSold(l))
    .map((l) => {
      // detect category from multiple possible fields
      const rawCat =
        l.category ??
        l.menuCategory ??
        l.menuCategories ??
        l.productCategory ??
        l.meta?.category;

      const cat = normCategory(rawCat);

      const out: PublicListing = {
        id: l.id,
        ...l,
        category: cat,
        imageUrl: pickBestImage(l),
      };
      return out;
    })
    .filter((l) => {
      if (!wantCategory) return true;
      if (!ALLOWED.has(wantCategory)) return true; // if unknown, don't hide everything
      return l.category === wantCategory;
    });

  return filtered;
}
