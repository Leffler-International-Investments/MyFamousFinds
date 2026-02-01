// FILE: /lib/publicListings.ts
// Public listings loader for category pages + homepage
// Works with Firestore web SDK and performs robust normalization
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../utils/firebaseClient";

export type PublicListing = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  images?: string[];
  image?: string;
  condition?: string;
  category?: string;
  createdAt?: any;
  isSold?: boolean;
  status?: string;
};

type GetPublicListingsOpts = {
  category?: string; // slug e.g. "women" | "jewelry" | "new-arrivals"
  take?: number;
};

const CATEGORY_ALIASES: Record<string, string> = {
  women: "WOMEN",
  woman: "WOMEN",
  ladies: "WOMEN",
  bags: "BAGS",
  bag: "BAGS",
  men: "MEN",
  mens: "MEN",
  jewelry: "JEWELRY",
  jewellery: "JEWELRY",
  watches: "WATCHES",
  watch: "WATCHES",
  "new-arrivals": "",
  new: "",
};

function normCategory(input: any): string {
  if (!input) return "";
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const lowered = trimmed.toLowerCase();
    const aliased = CATEGORY_ALIASES[lowered] ?? trimmed.toUpperCase();
    // Handle British spelling:
    if (aliased === "JEWELLERY") return "JEWELRY";
    return aliased;
  }
  if (typeof input === "object") {
    // handle select { value, label } or { name }
    const v = (input.value || input.label || input.name || "").toString();
    return normCategory(v);
  }
  return "";
}

function normalizeSlug(input: string): string {
  const c = normCategory(input);
  if (!c) return "";
  return c.toLowerCase() === "new arrivals" ? "new-arrivals" : c.toLowerCase();
}

function extractCategory(l: any): string {
  // Prefer the explicit canonical field first.
  const direct = normCategory(l?.category);
  if (direct) return direct;

  // Then prefer slug/name variants BEFORE legacy menuCategory (which has historically been wrong).
  const slugFirst = normCategory(
    l?.categorySlug ||
      l?.category_slug ||
      l?.categoryName ||
      l?.menu_category_slug ||
      l?.menuCategorySlug ||
      l?.menu_category
  );
  if (slugFirst) return slugFirst;

  // Legacy fallbacks (can be wrong if old admin UI wrote WATCHES everywhere).
  const legacy = normCategory(l?.menuCategory);
  if (legacy) return legacy;

  // Last resort: attempt to derive from title/description keywords.
  const hint = (l?.title || l?.name || l?.description || "").toString().toLowerCase();
  if (hint.includes("watch")) return "WATCHES";
  if (hint.includes("ring") || hint.includes("bracelet") || hint.includes("necklace") || hint.includes("earring"))
    return "JEWELRY";
  if (hint.includes("bag") || hint.includes("handbag") || hint.includes("tote") || hint.includes("clutch"))
    return "BAGS";
  return "";
}

function pickBestImage(l: any): string | undefined {
  const imgs = Array.isArray(l?.images) ? l.images : [];
  if (imgs.length) return imgs[0];
  if (typeof l?.image === "string" && l.image) return l.image;
  return undefined;
}

function isVisibleListing(l: any): boolean {
  // Sold should NOT appear
  if (l?.isSold === true) return false;
  if (typeof l?.status === "string") {
    const s = l.status.toLowerCase();
    if (s === "sold" || s === "removed" || s === "deleted") return false;
    // If you use "active" / "published", keep those
  }
  return true;
}

export async function getPublicListings(
  opts: GetPublicListingsOpts = {}
): Promise<PublicListing[]> {
  if (!db) {
    // Firebase client not configured; return empty list instead of crashing.
    return [];
  }

  const categorySlug = normalizeSlug(opts.category || "");
  const take = typeof opts.take === "number" ? opts.take : 200;

  // We query broadly (published/active) and then normalize/filter client-side.
  // This avoids Firestore OR queries across legacy fields.
  let q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(take));

  // Optional: If your schema has a strict visibility flag, uncomment:
  // q = query(collection(db, "listings"), where("isPublished", "==", true), orderBy("createdAt", "desc"), limit(take));

  const snap = await getDocs(q);

  const rows: PublicListing[] = [];
  snap.forEach((doc) => {
    const d: any = doc.data() || {};
    const cat = extractCategory(d);

    if (!isVisibleListing(d)) return;

    const normalizedSlug = normalizeSlug(cat);
    const matchesCategory =
      !categorySlug || categorySlug === "new-arrivals"
        ? true
        : normalizedSlug === categorySlug;

    if (!matchesCategory) return;

    rows.push({
      id: doc.id,
      title: d.title || d.name || "Untitled",
      brand: d.brand || d.designer || d.maker,
      price: typeof d.price === "number" ? d.price : Number(d.price) || undefined,
      currency: d.currency || "USD",
      images: Array.isArray(d.images) ? d.images : undefined,
      image: pickBestImage(d),
      condition: d.condition,
      category: cat,
      createdAt: d.createdAt,
      isSold: d.isSold,
      status: d.status,
    });
  });

  return rows;
}
