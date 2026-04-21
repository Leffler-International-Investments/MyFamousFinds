// FILE: /pages/api/admin/update-listing/[id].ts
// Updates any editable fields on a listing, including displayImageUrl (hero image).

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ ok: false, error: "Missing listing id" });

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not ready" });
  }

  try {
    const {
      title, brand, category, color, description, condition, size,
      priceUsd, status, displayImageUrl,
    } = req.body || {};

    const update: Record<string, any> = { updatedAt: Date.now() };

    if (title !== undefined)          update.title = String(title).trim();
    if (brand !== undefined)          update.brand = String(brand).trim();
    if (category !== undefined)       update.category = String(category).trim().toUpperCase();
    if (color !== undefined)          update.color = String(color).trim();
    if (description !== undefined)    update.description = String(description).trim();
    if (condition !== undefined)      update.condition = String(condition).trim();
    if (size !== undefined)           update.size = String(size).trim();
    if (status !== undefined)         update.status = String(status).trim().toLowerCase();
    if (priceUsd !== undefined) {
      const p = Number(String(priceUsd).replace(/[^0-9.]/g, ""));
      if (!isNaN(p) && p >= 0) { update.priceUsd = p; update.price = p; }
    }
    if (displayImageUrl !== undefined) {
      const s = String(displayImageUrl).trim();
      if (
        s.startsWith("http://") ||
        s.startsWith("https://") ||
        s.startsWith("data:image/")
      ) {
        update.displayImageUrl = s;
      }
    }

    await adminDb.collection("listings").doc(id).update(update);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[update-listing]", err);
    return res.status(500).json({ ok: false, error: err?.message || "Update failed" });
  }
}
