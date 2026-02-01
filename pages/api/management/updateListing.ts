// FILE: /pages/api/management/updateListing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/firebaseAdmin";

function canonCategory(input?: any): "" | "WOMEN" | "BAGS" | "MEN" | "JEWELRY" | "WATCHES" {
  if (!input) return "";
  const s = String(input).trim().toUpperCase();

  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";

  // Jewelry variants + common typo
  if (s === "JEWELLERY" || s === "JEWELRY" || s === "JEWELERY") return "JEWELRY";

  if (s === "WOMEN" || s === "BAGS" || s === "MEN" || s === "WATCHES") return s as any;

  return "";
}

function slugifyCategory(cat: string) {
  return String(cat || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const { id, patch } = req.body || {};
    if (!id || !patch) {
      return res.status(400).json({ ok: false, message: "Missing id or patch" });
    }

    const db = getDb();
    const ref = db.collection("listings").doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, message: "Listing not found" });
    }

    const nextPatch: any = { ...patch };

    // Normalize category + slug on every update to keep data clean
    const normalized = canonCategory(nextPatch.category ?? (snap.data() as any)?.category);
    if (normalized) {
      nextPatch.category = normalized;
      nextPatch.categorySlug = slugifyCategory(normalized);
    }

    nextPatch.updatedAt = new Date();

    await ref.update(nextPatch);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
