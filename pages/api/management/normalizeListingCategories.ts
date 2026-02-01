// FILE: /pages/api/management/normalizeListingCategories.ts
// ONE-TIME CLEANUP ENDPOINT
// - Sets canonical `category` for every listing (WOMEN/BAGS/MEN/JEWELRY/WATCHES)
// - Deletes legacy fields that cause category pages to show wrong items:
//   menuCategory, categoryLabel, categoryName, menuCategories
//
// SECURITY:
// - Requires your existing Vercel env var: ADMIN_SEED_KEY
// - Call with header: x-admin-key: <ADMIN_SEED_KEY>
//
// USAGE (example):
// curl -X POST "https://YOUR_DOMAIN/api/management/normalizeListingCategories" \
//   -H "x-admin-key: YOUR_ADMIN_SEED_KEY"

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

const CANON = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;
type Canon = (typeof CANON)[number];

function canonCategory(v: any): Canon | "" {
  const s = String(v || "")
    .trim()
    .toUpperCase();

  if (s === "WATCH" || s === "WATCHES") return "WATCHES";
  if (s === "WOMAN" || s === "WOMEN") return "WOMEN";
  if (s === "BAG" || s === "BAGS") return "BAGS";
  if (s === "MAN" || s === "MEN" || s === "MENS") return "MEN";
  if (s === "JEWELLERY" || s === "JEWELRY") return "JEWELRY";
  if ((CANON as readonly string[]).includes(s)) return s as Canon;

  return "";
}

function slugFromCanon(cat: Canon): string {
  return cat.toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // --- Auth using your existing ADMIN_SEED_KEY ---
    const requiredKey = process.env.ADMIN_SEED_KEY;
    if (!requiredKey) {
      return res.status(500).json({
        ok: false,
        message: "Missing ADMIN_SEED_KEY in Vercel environment variables.",
      });
    }

    const got = String(req.headers["x-admin-key"] || "");
    if (!got || got !== requiredKey) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        message: "Firebase Admin is not initialized. Check Firebase Admin env vars.",
      });
    }

    const listingsRef = adminDb.collection("listings");

    let scanned = 0;
    let updated = 0;

    const PAGE_SIZE = 350; // safe batch size
    let lastId: string | null = null;

    while (true) {
      let q = listingsRef.orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
      if (lastId) q = q.startAfter(lastId);

      const snap = await q.get();
      if (snap.empty) break;

      const batch = adminDb.batch();

      snap.docs.forEach((doc) => {
        scanned++;
        const d: any = doc.data() || {};

        // Pull category from ANY possible legacy field
        const raw =
          d.category ??
          d.menuCategory ??
          d.categoryLabel ??
          d.categoryName ??
          d.menuCategories ??
          "";

        const cat = canonCategory(raw);

        const hasLegacy =
          d.menuCategory != null ||
          d.categoryLabel != null ||
          d.categoryName != null ||
          d.menuCategories != null;

        const categoryAlreadyCanon =
          cat && String(d.category || "").trim().toUpperCase() === cat;

        // If category is already correct and no legacy fields exist, skip
        if (categoryAlreadyCanon && !hasLegacy) return;

        const patch: Record<string, any> = {
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Only write category if we can canonicalize it
        if (cat) {
          patch.category = cat;
          patch.categorySlug = slugFromCanon(cat);
        }

        // Delete legacy fields so public pages can never read stale values
        patch.menuCategory = FieldValue.deleteField();
        patch.categoryLabel = FieldValue.deleteField();
        patch.categoryName = FieldValue.deleteField();
        patch.menuCategories = FieldValue.deleteField();

        batch.set(doc.ref, patch, { merge: true });
        updated++;
      });

      await batch.commit();
      lastId = snap.docs[snap.docs.length - 1].id;

      if (snap.size < PAGE_SIZE) break;
    }

    return res.status(200).json({ ok: true, scanned, updated });
  } catch (e: any) {
    console.error("normalizeListingCategories error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
