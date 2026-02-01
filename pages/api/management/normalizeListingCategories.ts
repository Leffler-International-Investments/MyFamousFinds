// FILE: /pages/api/management/normalizeListingCategories.ts
// ONE-TIME CLEANUP ENDPOINT
// - Sets canonical `category` for every listing
// - Deletes legacy category fields that cause category pages to show wrong items

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

const CANON = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;
type Canon = (typeof CANON)[number];

function canonCategory(v: any): Canon | "" {
  const s = String(v || "").trim().toUpperCase();
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
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        message: "Firebase Admin is not initialized. Check Firebase Admin env vars.",
      });
    }

    // Optional safety: require a key if you set one in Vercel.
    const requiredKey = process.env.ADMIN_ACTION_KEY;
    if (requiredKey) {
      const got = String(req.headers["x-admin-key"] || "");
      if (!got || got !== requiredKey) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }
    }

    const listingsRef = adminDb.collection("listings");

    let updated = 0;
    let scanned = 0;

    const PAGE_SIZE = 400; // keep well below batch limit
    let lastDocId: string | null = null;

    while (true) {
      let q = listingsRef.orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
      if (lastDocId) q = q.startAfter(lastDocId);

      const snap = await q.get();
      if (snap.empty) break;

      const batch = adminDb.batch();

      snap.docs.forEach((doc) => {
        scanned++;
        const d: any = doc.data() || {};

        // Pull from ANY legacy fields, but write back ONLY to `category`
        const raw =
          d.category ??
          d.menuCategory ??
          d.categoryLabel ??
          d.categoryName ??
          d.menuCategories ??
          "";

        const cat = canonCategory(raw);

        // Decide if we need to write
        const hasLegacy =
          d.menuCategory != null || d.categoryLabel != null || d.categoryName != null || d.menuCategories != null;

        const alreadyOk =
          cat &&
          String(d.category || "").trim().toUpperCase() === cat &&
          (!hasLegacy);

        if (alreadyOk) return;

        const patch: any = {
          updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
        };

        if (cat) {
          patch.category = cat;
          patch.categorySlug = slugFromCanon(cat);
        }

        // Delete legacy fields (prevents OR-chain from reading stale values)
        if (FieldValue?.deleteField) {
          patch.menuCategory = FieldValue.deleteField();
          patch.categoryLabel = FieldValue.deleteField();
          patch.categoryName = FieldValue.deleteField();
          patch.menuCategories = FieldValue.deleteField();
        }

        batch.set(doc.ref, patch, { merge: true });
        updated++;
      });

      await batch.commit();
      lastDocId = snap.docs[snap.docs.length - 1].id;

      if (snap.size < PAGE_SIZE) break;
    }

    return res.status(200).json({ ok: true, scanned, updated });
  } catch (e: any) {
    console.error("normalizeListingCategories error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
