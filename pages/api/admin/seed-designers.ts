// FILE: /pages/api/admin/seed-designers.ts
// Seed / upsert many designers at once.
// Auth: header x-admin-key == process.env.ADMIN_SEED_KEY
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

type Resp = { ok: true; upserted: number } | { ok: false; error: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Top 25 luxury houses across fashion, leather goods, jewelry, watches
const DEFAULT_DESIGNERS = [
  "Chanel",
  "Gucci",
  "Hermès",
  "Louis Vuitton",
  "Prada",
  "Dior",
  "Celine",
  "Saint Laurent",
  "Balenciaga",
  "Bottega Veneta",
  "Givenchy",
  "Fendi",
  "Versace",
  "Valentino",
  "Burberry",
  "Alexander McQueen",
  "Loewe",
  "Miu Miu",
  "Tom Ford",
  "Off-White",
  "Rolex",
  "Cartier",
  "Tiffany & Co.",
  "Van Cleef & Arpels",
  "TAG Heuer"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    let names: string[] | null = null;
    if (Array.isArray((req.body as any)?.designers)) names = (req.body as any).designers;
    else if (typeof (req.body as any)?.text === "string") {
      names = (req.body as any).text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }
    if (!names || names.length === 0) names = DEFAULT_DESIGNERS;

    const batch = adminDb.batch();
    let count = 0;
    for (const raw of names) {
      const name = String(raw || "").trim();
      if (!name) continue;
      const slug = slugify(name);
      batch.set(
        adminDb.collection("designers").doc(slug),
        { name, slug, approved: true, createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      count++;
    }
    if (!count) return res.status(400).json({ ok: false, error: "no_valid_names" });

    await batch.commit();
    return res.status(200).json({ ok: true, upserted: count });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
