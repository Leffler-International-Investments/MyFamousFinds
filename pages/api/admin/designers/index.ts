// FILE: /pages/api/admin/designers/index.ts
// GET: list designers (optional ?q=), POST: add/update one by name
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type D = { id: string; name: string; slug: string; approved?: boolean };
type ListResp = { ok: true; designers: D[] } | { ok: false; error: string };
type PostResp = { ok: true; id: string } | { ok: false; error: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListResp | PostResp>) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const q = String(req.query.q || "").toLowerCase().trim();
      let ref = adminDb.collection("designers").orderBy("name");
      const snap = await ref.get();
      let designers: D[] = snap.docs.map(d => {
        const x = d.data() as any;
        return { id: d.id, name: x?.name ?? d.id, slug: x?.slug ?? d.id, approved: x?.approved };
      });
      if (q) designers = designers.filter(d => d.name.toLowerCase().includes(q) || d.slug.includes(q));
      return res.status(200).json({ ok: true, designers });
    }

    if (req.method === "POST") {
      const name = String((req.body as any)?.name || "").trim();
      if (!name) return res.status(400).json({ ok: false, error: "missing_name" });
      const slug = slugify(name);
      await adminDb.collection("designers").doc(slug).set({ name, slug, approved: true }, { merge: true });
      return res.status(200).json({ ok: true, id: slug });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
