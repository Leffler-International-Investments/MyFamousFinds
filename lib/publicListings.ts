// FILE: /lib/publicListings.ts
import { getDb } from "./firebaseAdmin";

export type PublicListing = {
  id: string;
  title?: string;
  name?: string;
  designer?: string;
  brand?: string;
  price?: number;
  currency?: string;
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string;
  category?: string;
  categorySlug?: string;
  condition?: string;
  createdAt?: any;
  updatedAt?: any;
  status?: string;
  sold?: boolean;
  isSold?: boolean;
  archived?: boolean;
  isArchived?: boolean;
  isActive?: boolean;
  active?: boolean;
};

const CANON = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;

function normCategory(input?: any): "" | (typeof CANON)[number] {
  if (!input) return "";
  const s = String(input).trim().toUpperCase();

  // common variants / typos
  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";

  // Jewelry variants: JEWELRY, JEWELLERY, and common typo JEWELERY
  if (s === "JEWELRY" || s === "JEWELLERY" || s === "JEWELERY") return "JEWELRY";

  if ((CANON as readonly string[]).includes(s)) return s as any;
  return "";
}

function extractCategory(x: any): any {
  return (
    x?.category ??
    x?.categorySlug ??
    x?.menuCategory ??
    x?.menuCategorySlug ??
    x?.primaryCategory ??
    x?.department ??
    ""
  );
}

function isTruthySold(x: any): boolean {
  return Boolean(x?.sold || x?.isSold);
}

function isArchivedOrInactive(x: any): boolean {
  return Boolean(
    x?.archived ||
      x?.isArchived ||
      x?.active === false ||
      x?.isActive === false
  );
}

export async function getPublicListings(opts?: { category?: string; take?: number }) {
  const db = getDb();
  const take = Math.min(Math.max(opts?.take ?? 200, 1), 1000);
  const wanted = normCategory(opts?.category);

  // NOTE: We intentionally fetch "approved & unsold" broadly,
  // then apply category filtering in-memory to avoid brittle OR queries.
  const snap = await db
    .collection("listings")
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(take)
    .get();

  const all: any[] = [];
  snap.forEach((doc: any) => all.push({ id: doc.id, ...doc.data() }));

  const filtered = all
    .filter((x) => !isTruthySold(x))
    .filter((x) => !isArchivedOrInactive(x))
    .filter((x) => {
      if (!wanted) return true;
      const cat = normCategory(extractCategory(x));
      return cat === wanted;
    });

  return filtered;
}
