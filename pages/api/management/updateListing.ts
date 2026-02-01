// FILE: /pages/api/management/updateListing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";

type Body = {
  id?: string;
  patch?: Record<string, any>;
};

const ALLOWED_CATEGORIES = new Set(["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        message:
          "Firebase Admin is not initialized. Check your Firebase Admin env vars in Vercel.",
      });
    }

    const body = (req.body || {}) as Body;
    const id = String(body.id || "").trim();
    const patch = (body.patch || {}) as Record<string, any>;

    if (!id) return res.status(400).json({ message: "Missing listing id" });
    if (!patch || typeof patch !== "object") {
      return res.status(400).json({ message: "Missing patch object" });
    }

    // Normalize + validate category if provided
    if (Object.prototype.hasOwnProperty.call(patch, "category")) {
      const cat = String(patch.category || "").trim().toUpperCase();
      if (cat && !ALLOWED_CATEGORIES.has(cat)) {
        return res.status(400).json({
          message: `Invalid category. Use: WOMEN, BAGS, MEN, JEWELRY, WATCHES`,
        });
      }
      patch.category = cat;
    }

    // Normalize status if provided (optional, but helpful)
    if (Object.prototype.hasOwnProperty.call(patch, "status")) {
      patch.status = String(patch.status || "").trim();
    }

    // Stamp updatedAt (prefer serverTimestamp)
    patch.updatedAt = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date();

    await adminDb.collection("listings").doc(id).set(patch, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
