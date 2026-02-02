// FILE: /lib/publicListings.ts
// Public listings loader used by category pages and homepage.
// IMPORTANT: This file must NOT import firebase-admin.

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";

import { db as clientDb } from "@/utils/firebaseClient";

export type PublicListing = {
  id: string;
  category?: string;
  categorySlug?: string;
  status?: string;
  sold?: boolean;
  isSold?: boolean;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
};

const CATEGORY_CANON: Record<string, string> = {
  women: "WOMEN",
  bags: "BAGS",
  men: "MEN",
  jewelry: "JEWELRY",
  watches: "WATCHES",
};

function canonSlug(input: any): string {
  if (!input) return "";
  return String(input).trim().toLowerCase();
}

function canonUpperCategoryFromSlug(slug: string): string {
  return CATEGORY_CANON[canonSlug(slug)] || "";
}

function looksSold(d: any): boolean {
  if (!d) return false;
  const status = String(d.status || "").toLowerCase();
  if (status === "sold") return true;
  if (d.sold === true) return true;
  if (d.isSold === true) return true;
  return false;
}

function looksLive(d: any): boolean {
  const status = String(d?.status || "").toLowerCase();
  // Common “live/active” values observed in this repo:
  if (status === "live") return true;
  if (status === "active") return true;
  if (status === "approved") return true;
  if (status === "") return true; // tolerate missing status
  return false;
}

function matchesCategory(d: any, slug: string): boolean {
  const s = canonSlug(slug);
  if (!s) return true;

  const wantUpper = canonUpperCategoryFromSlug(s);

  const cat = String(d?.category || "").trim();
  const catSlug = canonSlug(d?.categorySlug);

  if (catSlug && catSlug === s) return true;
  if (wantUpper && cat.toUpperCase() === wantUpper) return true;

  // Tolerate “Jewelry” vs “JEWELRY” etc
  if (cat && canonSlug(cat) === s) return true;

  return false;
}

export async function getPublicListings(opts?: {
  category?: string;
  take?: number;
}): Promise<PublicListing[]> {
  const take = Math.max(1, Math.min(Number(opts?.take || 200), 500));
  const categorySlug = canonSlug(opts?.category);

  // If Firebase client isn't configured, return empty list (prevents crashes)
  if (!clientDb) return [];

  const baseConstraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(take),
  ];

  // Primary strategy: keep Firestore query simple (avoid composite index problems)
  // 1) Fetch recent items
  // 2) Filter in-memory to enforce “live” and correct category matching
  const q = query(collection(clientDb, "listings"), ...baseConstraints);
  const snap = await getDocs(q);

  const items: PublicListing[] = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));

  const filtered = items
    .filter((d) => looksLive(d))
    .filter((d) => !looksSold(d))
    .filter((d) => matchesCategory(d, categorySlug));

  // If category page and nothing matched, do one targeted query attempt
  // (for deployments where category is reliably stored as uppercase field).
  if (categorySlug && filtered.length === 0) {
    const wantUpper = canonUpperCategoryFromSlug(categorySlug);
    if (wantUpper) {
      const q2 = query(
        collection(clientDb, "listings"),
        where("category", "==", wantUpper),
        orderBy("createdAt", "desc"),
        limit(take)
      );
      const snap2 = await getDocs(q2);
      const items2: PublicListing[] = snap2.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      return items2.filter((d) => looksLive(d)).filter((d) => !looksSold(d));
    }
  }

  return filtered;
}
