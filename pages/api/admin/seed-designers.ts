// FILE: /pages/api/admin/seed-designers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { CATEGORIZED_DESIGNERS } from "../../../lib/filterConstants";

const slug = (s:string)=> s.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method_not_allowed" });

  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok:false, error:"unauthorized" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const body = (req.body || {}) as { text?: string };
    // If custom text is provided, treat as simple name list (no category);
    // otherwise use the full categorized DEFAULT_DESIGNERS list.
    const entries: { name: string; designerCategory?: string }[] = body.text
      ? body.text.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean).map((n: string) => ({ name: n }))
      : CATEGORIZED_DESIGNERS;

    let upserted = 0;
    const batch = adminDb.batch();

    entries.forEach((entry) => {
      const name = entry.name.trim();
      if (!name) return;
      const id = slug(name);
      const ref = adminDb.collection("designers").doc(id);
      batch.set(ref, {
        name,
        slug: id,
        approved: true,
        active: true,
        ...(entry.designerCategory ? { designerCategory: entry.designerCategory } : {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      upserted++;
    });

    await batch.commit();
    res.status(200).json({ ok:true, upserted });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || "seed_failed" });
  }
}
