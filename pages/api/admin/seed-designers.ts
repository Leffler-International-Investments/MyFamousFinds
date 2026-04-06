// FILE: /pages/api/admin/seed-designers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type DesignerSeed = { name: string; designerCategory: "high-end" | "contemporary" | "jewelry-watches" | "kids" };

const DEFAULT_DESIGNERS: DesignerSeed[] = [
  // --- High-End Luxury ---
  { name: "Chanel", designerCategory: "high-end" },
  { name: "Gucci", designerCategory: "high-end" },
  { name: "Hermès", designerCategory: "high-end" },
  { name: "Louis Vuitton", designerCategory: "high-end" },
  { name: "Prada", designerCategory: "high-end" },
  { name: "Dior", designerCategory: "high-end" },
  { name: "Celine", designerCategory: "high-end" },
  { name: "Saint Laurent", designerCategory: "high-end" },
  { name: "Balenciaga", designerCategory: "high-end" },
  { name: "Bottega Veneta", designerCategory: "high-end" },
  { name: "Givenchy", designerCategory: "high-end" },
  { name: "Fendi", designerCategory: "high-end" },
  { name: "Versace", designerCategory: "high-end" },
  { name: "Valentino", designerCategory: "high-end" },
  { name: "Burberry", designerCategory: "high-end" },
  { name: "Alexander McQueen", designerCategory: "high-end" },
  { name: "Loewe", designerCategory: "high-end" },
  { name: "Miu Miu", designerCategory: "high-end" },
  { name: "Tom Ford", designerCategory: "high-end" },
  { name: "Cartier", designerCategory: "high-end" },
  { name: "TAG Heuer", designerCategory: "high-end" },
  { name: "Dries Van Noten", designerCategory: "high-end" },
  { name: "Raf Simons", designerCategory: "high-end" },
  { name: "Maison Margiela", designerCategory: "high-end" },
  { name: "Issey Miyake", designerCategory: "high-end" },
  { name: "Rick Owens", designerCategory: "high-end" },
  { name: "Comme des Garçons", designerCategory: "high-end" },
  { name: "Jil Sander", designerCategory: "high-end" },
  { name: "Stella McCartney", designerCategory: "high-end" },
  { name: "Khaite", designerCategory: "high-end" },
  { name: "The Row", designerCategory: "high-end" },
  { name: "Brunello Cucinelli", designerCategory: "high-end" },
  { name: "Dolce & Gabbana", designerCategory: "high-end" },
  { name: "Christian Louboutin", designerCategory: "high-end" },
  { name: "Manolo Blahnik", designerCategory: "high-end" },
  { name: "Jimmy Choo", designerCategory: "high-end" },
  { name: "Golden Goose", designerCategory: "high-end" },
  { name: "Birkenstock", designerCategory: "high-end" },
  { name: "Berluti", designerCategory: "high-end" },
  // --- Jewelry & Watches ---
  { name: "Tiffany & Co.", designerCategory: "jewelry-watches" },
  { name: "Van Cleef & Arpels", designerCategory: "jewelry-watches" },
  { name: "Boucheron", designerCategory: "jewelry-watches" },
  { name: "David Yurman", designerCategory: "jewelry-watches" },
  { name: "Rolex", designerCategory: "jewelry-watches" },
  { name: "Patek Philippe", designerCategory: "jewelry-watches" },
  { name: "Audemars Piguet", designerCategory: "jewelry-watches" },
  // --- Contemporary ---
  { name: "A.L.C.", designerCategory: "contemporary" },
  { name: "Alice + Olivia", designerCategory: "contemporary" },
  { name: "Ganni", designerCategory: "contemporary" },
  { name: "Reformation", designerCategory: "contemporary" },
  { name: "Veronica Beard", designerCategory: "contemporary" },
  { name: "Rag & Bone", designerCategory: "contemporary" },
  { name: "Theory", designerCategory: "contemporary" },
  { name: "Helmut Lang", designerCategory: "contemporary" },
  { name: "Vince", designerCategory: "contemporary" },
  { name: "Nanushka", designerCategory: "contemporary" },
  { name: "Ulla Johnson", designerCategory: "contemporary" },
  { name: "Zimmermann", designerCategory: "contemporary" },
  { name: "Cult Gaia", designerCategory: "contemporary" },
  { name: "Jonathan Simkhai", designerCategory: "contemporary" },
  { name: "Frame", designerCategory: "contemporary" },
  { name: "Off-White", designerCategory: "contemporary" },
  { name: "Fear of God", designerCategory: "contemporary" },
  { name: "1017 Alyx 9SM", designerCategory: "contemporary" },
  { name: "Palm Angels", designerCategory: "contemporary" },
  { name: "Billionaire Boys Club", designerCategory: "contemporary" },
  { name: "Hood By Air", designerCategory: "contemporary" },
  { name: "Heron Preston", designerCategory: "contemporary" },
  { name: "Rhude", designerCategory: "contemporary" },
  { name: "Human Made", designerCategory: "contemporary" },
  { name: "Self-Portrait", designerCategory: "contemporary" },
  { name: "PatBo", designerCategory: "contemporary" },
  { name: "Sandro", designerCategory: "contemporary" },
  { name: "Aje", designerCategory: "contemporary" },
  { name: "Maje", designerCategory: "contemporary" },
  { name: "Staud", designerCategory: "contemporary" },
  { name: "Christopher John Rogers", designerCategory: "contemporary" },
  { name: "Sacai", designerCategory: "contemporary" },
  { name: "Borsalino", designerCategory: "contemporary" },
  { name: "Poupette St.Barths", designerCategory: "contemporary" },
  { name: "SEA", designerCategory: "contemporary" },
  { name: "Lolita Jaca", designerCategory: "contemporary" },
  { name: "Marine Serre", designerCategory: "contemporary" },
  { name: "Mugler", designerCategory: "contemporary" },
  { name: "Area", designerCategory: "contemporary" },
  { name: "LaQuan Smith", designerCategory: "contemporary" },
  { name: "Wales Bonner", designerCategory: "contemporary" },
  { name: "Simone Rocha", designerCategory: "contemporary" },
  { name: "Jacquemus", designerCategory: "contemporary" },
  // --- Kids ---
  { name: "La Coqueta", designerCategory: "kids" },
  { name: "Pepa & Co", designerCategory: "kids" },
  { name: "Tartine et Chocolat", designerCategory: "kids" },
  { name: "Marie-Chantal", designerCategory: "kids" },
  { name: "Caramel London", designerCategory: "kids" },
  { name: "Petit Bateau", designerCategory: "kids" },
  { name: "Jacadi", designerCategory: "kids" },
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
    // If custom text is provided, treat as simple name list (no category);
    // otherwise use the full categorized DEFAULT_DESIGNERS list.
    const entries: { name: string; designerCategory?: string }[] = body.text
      ? body.text.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean).map((n: string) => ({ name: n }))
      : DEFAULT_DESIGNERS;

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
