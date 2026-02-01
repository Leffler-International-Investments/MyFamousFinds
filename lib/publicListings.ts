// FILE: /lib/publicListings.ts
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
// ✅ REQUIRED FIX: Standardized to admin utility
import { db } from "@/utils/firebaseAdmin"; 

export type PublicListing = {
  id: string;
  title?: string;
  brand?: string;
  designer?: string;
  price?: number;
  category?: string;
  material?: string; // Added for consistency
  condition?: string;
  imageUrl?: string;
  status?: string;
  isSold?: boolean;
  createdAt?: any;
  [key: string]: any;
};

const ALLOWED = new Set(["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"]);

function normCategory(raw: any): string {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "JEWELLERY") return "JEWELRY";
  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";
  return s;
}

function normalizeSlug(slug: string): string {
  const s = String(slug || "").trim().toLowerCase();
  if (!s || s === "new-arrivals" || s === "catalogue") return "";
  if (s === "women") return "WOMEN";
  if (s === "bags") return "BAGS";
  if (s === "men") return "MEN";
  if (s === "jewelry" || s === "jewellery") return "JEWELRY";
  if (s === "watches") return "WATCHES";
  return normCategory(s);
}

function pickBestImage(l: any): string {
  const fromSingle = l.imageUrl || l.primaryImageUrl || l.image;
  if (typeof fromSingle === "string" && fromSingle.trim()) return fromSingle.trim();
  const arr = l.images || l.imageUrls || [];
  return Array.isArray(arr) && arr.length > 0 ? String(arr[0]).trim() : "";
}

export async function getPublicListings(opts?: {
  category?: string;
  take?: number; // ✅ Standardized parameter
}): Promise<PublicListing[]> {
  const take = Math.max(1, Math.min(1000, Number(opts?.take ?? 200)));
  const wantCategory = normalizeSlug(opts?.category ?? "");
  const col = collection(db, "listings");
  const q = query(col, orderBy("createdAt", "desc"), limit(take));

  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  return all
    .filter((l) => !l.isSold && !l.sold)
    .map((l) => ({
      ...l,
      id: l.id,
      category: normCategory(l.category),
      imageUrl: pickBestImage(l),
    }))
    .filter((l) => {
      if (!wantCategory) return true;
      if (!ALLOWED.has(wantCategory)) return true;
      return l.category === wantCategory;
    });
}
