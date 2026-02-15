// FILE: /pages/api/admin/update-category/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

const ALLOWED = new Set([
  "WOMEN", "BAGS", "MEN", "KIDS", "JEWELRY", "WATCHES",
  "SHOES", "CLOTHING", "ACCESSORIES", "PARTY-DRESSES", "NEW-ARRIVALS",
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        error:
          "Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY) in Vercel env vars.",
      });
    }

    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "Missing listing id" });

    const categoryRaw = (req.body?.category ?? "").toString().trim().toUpperCase();
    if (!categoryRaw) return res.status(400).json({ ok: false, error: "Missing category" });

    if (!ALLOWED.has(categoryRaw)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid category. Use: WOMEN, BAGS, MEN, KIDS, JEWELRY, WATCHES, SHOES, CLOTHING, ACCESSORIES",
      });
    }

    await adminDb.collection("listings").doc(id).set(
      {
        category: categoryRaw,
        updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
