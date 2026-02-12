// FILE: /pages/api/management/normalizeListingCategories.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";

const CANON = ["WOMEN", "BAGS", "MEN", "KIDS", "JEWELRY", "WATCHES"] as const;
type Canon = (typeof CANON)[number];

function normCategory(v: any): Canon | "" {
  const s = String(v || "").trim().toUpperCase();
  if (s === "WATCH" || s === "WATCHES") return "WATCHES";
  if (s === "WOMAN" || s === "WOMEN") return "WOMEN";
  if (s === "BAG" || s === "BAGS") return "BAGS";
  if (s === "MAN" || s === "MEN" || s === "MENS") return "MEN";
  if (s === "KID" || s === "KIDS" || s === "CHILDREN" || s === "CHILDRENS") return "KIDS";
  if (s === "JEWELLERY" || s === "JEWELRY") return "JEWELRY";
  return (CANON as readonly string[]).includes(s) ? (s as Canon) : "";
}

function adminKeyOk(req: NextApiRequest): boolean {
  const headerKey = String(req.headers["x-admin-key"] || "").trim();
  const envKey =
    String(process.env.ADMIN_SEED_KEY || "").trim() ||
    String(process.env.ADMIN_ACTION_KEY || "").trim();
  return Boolean(envKey) && headerKey === envKey;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  if (!adminKeyOk(req)) return res.status(401).json({ ok: false, message: "Unauthorized" });

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        message: "Firebase Admin not initialized. Check Firebase Admin env vars in Vercel.",
      });
    }

    const max = Math.min(Math.max(Number((req.body?.max ?? 500) as any) || 500, 1), 2000);

    // Pull a batch (repeat-run if you have more than 500)
    let snap;
    try {
      snap = await adminDb.collection("listings").orderBy("createdAt", "desc").limit(max).get();
    } catch {
      snap = await adminDb.collection("listings").limit(max).get();
    }

    let scanned = 0;
    let changed = 0;
    let skippedNoCategory = 0;
    let unknownCategory = 0;

    const commits: Promise<any>[] = [];
    const BATCH_SIZE = 250;

    for (const doc of snap.docs) {
      scanned++;
      const d: any = doc.data() || {};

      // Pick category from any legacy field (but we will WRITE ONLY to `category`)
      const picked =
        d.category ??
        d.categoryLabel ??
        d.categoryName ??
        d.menuCategory ??
        d.menuCategories ??
        d.category_name;

      const canon = normCategory(picked);

      if (!picked) {
        skippedNoCategory++;
        continue;
      }
      if (!canon) {
        unknownCategory++;
        continue;
      }

      // If already clean + matching, still delete legacy fields (one-time cleanup)
      const patch: Record<string, any> = {
        category: canon,

        // Delete all legacy/conflicting fields so nothing else can “win”
        categoryLabel: FieldValue.delete(),
        categoryName: FieldValue.delete(),
        menuCategory: FieldValue.delete(),
        menuCategories: FieldValue.delete(),
        category_name: FieldValue.delete(),

        // keep a timestamp
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Only count as changed if it needed fixing OR legacy fields exist
      const needs =
        String(d.category || "").trim().toUpperCase() !== canon ||
        "categoryLabel" in d ||
        "categoryName" in d ||
        "menuCategory" in d ||
        "menuCategories" in d ||
        "category_name" in d;

      if (needs) changed++;

      commits.push(adminDb.collection("listings").doc(doc.id).set(patch, { merge: true }));

      // throttle
      if (commits.length >= BATCH_SIZE) {
        await Promise.all(commits.splice(0, commits.length));
      }
    }

    if (commits.length) await Promise.all(commits);

    return res.status(200).json({
      ok: true,
      scanned,
      changed,
      skippedNoCategory,
      unknownCategory,
      note: "Re-run if you have more than `max` listings.",
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
