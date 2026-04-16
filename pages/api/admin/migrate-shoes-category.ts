// FILE: /pages/api/admin/migrate-shoes-category.ts
//
// One-shot admin migration: scan `listings`, find docs whose title/brand
// clearly describes footwear (sneaker, sandal, heel, boot, slide, mule, ...)
// but are currently categorized as something other than SHOES, and
// rewrite their `category` field to "Shoes".
//
// Usage (from an admin-authenticated browser session):
//
//   POST /api/admin/migrate-shoes-category           dry-run, returns the plan
//   POST /api/admin/migrate-shoes-category?apply=1   actually writes
//
// Or via curl with ADMIN_API_SECRET:
//   curl -X POST -H "x-admin-secret: $KEY" \
//     "https://www.myfamousfinds.com/api/admin/migrate-shoes-category?apply=1"
//
// The matcher mirrors lib/publicListings.ts::looksLikeShoes + the same
// apparel/bag exclusions used by the SHOES category filter, so results
// here match what appears on /category/shoes.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

const SHOE_KEYWORDS = [
  "shoe", "shoes",
  "heel", "heels", "high heel", "high heels",
  "pump", "pumps",
  "sneaker", "sneakers", "snicker", "snickers",
  "trainer", "trainers",
  "boot", "boots", "bootie", "booties", "ankle boot",
  "sandal", "sandals",
  "slide", "slides",
  "mule", "mules",
  "loafer", "loafers",
  "slipper", "slippers",
  "oxford", "oxfords",
  "derby",
  "brogue", "brogues",
  "stiletto", "stilettos",
  "espadrille", "espadrilles",
  "moccasin", "moccasins",
  "clog", "clogs",
  "wedge", "wedges",
  "flip flop", "flip-flop", "flip flops",
  "footwear",
];

const APPAREL_KEYWORDS = [
  "jacket", "coat", "parka", "blazer", "suit", "shirt",
  "tee", "t-shirt", "sweater", "hoodie", "pants", "trouser",
  "jeans", "skirt", "dress", "shorts", "cardigan", "vest",
  "robe", "gown",
];

const BAG_KEYWORDS = [
  "handbag", "tote", "satchel", "crossbody", "cross-body",
  "pouch", "clutch", "backpack", "bucket bag", "hobo",
  "duffle", "briefcase", "luggage", "trunk", "wallet",
  // 'bag' matches too broadly with 'bags' the category name — keep explicit forms
  "shoulder bag", "top handle", "flap bag",
];

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((k) => haystack.includes(k));
}

function isShoeTitle(title: string, brand: string): {
  shoe: boolean;
  excludedByApparel: boolean;
  excludedByBag: boolean;
  matchedKeyword: string | null;
} {
  const t = `${title || ""} ${brand || ""}`.toLowerCase();
  const kw = SHOE_KEYWORDS.find((k) => t.includes(k)) || null;
  return {
    shoe: Boolean(kw),
    excludedByApparel: matchesAny(t, APPAREL_KEYWORDS),
    excludedByBag: matchesAny(t, BAG_KEYWORDS),
    matchedKeyword: kw,
  };
}

type ApiOk = {
  ok: true;
  applied: boolean;
  scanned: number;
  wouldUpdate: number;
  updated: number;
  sample: Array<{
    id: string;
    title: string;
    brand: string;
    previousCategory: string;
    matchedKeyword: string | null;
  }>;
};
type ApiErr = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;
  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  }

  const apply = req.query.apply === "1" || req.query.apply === "true";

  try {
    const snap = await adminDb.collection("listings").limit(2000).get();

    let scanned = 0;
    let wouldUpdate = 0;
    let updated = 0;
    const sample: ApiOk["sample"] = [];
    const batch = adminDb.batch();
    let pending = 0;

    for (const doc of snap.docs) {
      scanned++;
      const d: any = doc.data() || {};
      const title = String(d.title || d.name || "");
      const brand = String(d.brand || d.designer || "");
      const currentCategory = String(d.category || "").trim();

      const m = isShoeTitle(title, brand);
      if (!m.shoe) continue;
      if (m.excludedByApparel) continue;
      if (m.excludedByBag) continue;

      const alreadyShoes = currentCategory.toUpperCase() === "SHOES";
      if (alreadyShoes) continue;

      wouldUpdate++;
      if (sample.length < 25) {
        sample.push({
          id: doc.id,
          title,
          brand,
          previousCategory: currentCategory,
          matchedKeyword: m.matchedKeyword,
        });
      }

      if (apply) {
        batch.set(
          doc.ref,
          { category: "Shoes", updatedAt: new Date() },
          { merge: true }
        );
        pending++;
        if (pending >= 400) {
          await batch.commit();
          updated += pending;
          pending = 0;
        }
      }
    }

    if (apply && pending > 0) {
      await batch.commit();
      updated += pending;
    }

    return res.status(200).json({
      ok: true,
      applied: apply,
      scanned,
      wouldUpdate,
      updated,
      sample,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "server_error",
    });
  }
}
