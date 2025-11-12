// FILE: /pages/api/admin/seed-designers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

const DEFAULT_25 = [
  "Chanel","Gucci","Hermès","Louis Vuitton","Prada","Dior","Celine",
  "Saint Laurent","Balenciaga","Bottega Veneta","Givenchy","Fendi",
  "Versace","Valentino","Burberry","Alexander McQueen","Loewe","Miu Miu",
  "Tom Ford","Off-White","Rolex","Cartier","Tiffany & Co.","Van Cleef & Arpels","TAG Heuer",
];

const slug = (s:string)=> s.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method_not_allowed" });

  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok:false, error:"unauthorized" });
  }

  try {
    const body = (req.body || {}) as { text?: string };
    const names = body.text
      ? body.text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
      : DEFAULT_25;

    let upserted = 0;
    const batch = adminDb.batch();

    names.forEach((nameRaw) => {
      const name = nameRaw.trim();
      if (!name) return;
      const id = slug(name);
      const ref = adminDb.collection("designers").doc(id);
      batch.set(ref, {
        name,
        slug: id,
        approved: true,
        active: true,
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
