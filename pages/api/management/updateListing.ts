// FILE: /pages/api/management/updateListing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";

type Body = {
  id?: string;
  patch?: Record<string, any>;
};

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
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        message: "Firebase Admin is not initialized. Check your Firebase Admin env vars in Vercel.",
      });
    }

    const body = (req.body || {}) as Body;
    const id = String(body.id || "").trim();
    const patch = (body.patch || {}) as Record<string, any>;

    if (!id) return res.status(400).json({ message: "Missing listing id" });
    if (!patch || typeof patch !== "object") return res.status(400).json({ message: "Missing patch object" });

    // ✅ If category is being updated, make it the ONLY source of truth.
    if (Object.prototype.hasOwnProperty.call(patch, "category")) {
      const cat = canonCategory(patch.category);

      if (!cat) {
        return res.status(400).json({
          message: "Invalid category. Use: WOMEN, BAGS, MEN, JEWELRY, WATCHES",
        });
      }

      patch.category = cat;
      patch.categorySlug = slugFromCanon(cat);

      // ✅ Kill conflicting legacy fields so the public pages cannot read stale values
      if (FieldValue?.deleteField) {
        patch.menuCategory = FieldValue.deleteField();
        patch.categoryLabel = FieldValue.deleteField();
        patch.categoryName = FieldValue.deleteField();
        patch.menuCategories = FieldValue.deleteField();
      }
    }

    // Normalize status if provided
    if (Object.prototype.hasOwnProperty.call(patch, "status")) {
      patch.status = String(patch.status || "").trim();
    }

    // Stamp updatedAt
    patch.updatedAt = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date();

    await adminDb.collection("listings").doc(id).set(patch, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("updateListing error:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
