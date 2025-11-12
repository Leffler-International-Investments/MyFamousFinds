// FILE: /pages/api/management/seed-designers.ts
// Seed default top designers into the "designers" collection in Firestore.
// Idempotent: same slug => same doc, using merge:true.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type ApiOk = { ok: true; count: number };
type ApiErr = { ok: false; error: string };

const DEFAULT_DESIGNERS: {
  name: string;
  slug: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  itemTypes?: string;
}[] = [
  { name: "Alexander McQueen", slug: "alexander-mcqueen", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Balenciaga", slug: "balenciaga", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Bottega Veneta", slug: "bottega-veneta", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Burberry", slug: "burberry", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Chanel", slug: "chanel", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Dior", slug: "dior", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Fendi", slug: "fendi", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Givenchy", slug: "givenchy", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Gucci", slug: "gucci", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Hermès", slug: "hermes", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Loewe", slug: "loewe", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Louis Vuitton", slug: "louis-vuitton", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Prada", slug: "prada", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Saint Laurent", slug: "saint-laurent", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Valentino", slug: "valentino", isTop: true, itemTypes: "B,S,J,C" },
  { name: "Versace", slug: "versace", isTop: true, itemTypes: "B,S,J,C" },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const col = adminDb.collection("designers");
    const batch = adminDb.batch();
    let count = 0;

    for (const d of DEFAULT_DESIGNERS) {
      const ref = col.doc(d.slug);
      batch.set(
        ref,
        {
          name: d.name,
          slug: d.slug,
          isTop: d.isTop ?? false,
          isUpcoming: d.isUpcoming ?? false,
          itemTypes: d.itemTypes ?? "B,S,J,C",
          approved: true,
          active: true,
        },
        { merge: true }
      );
      count++;
    }

    await batch.commit();

    return res.status(200).json({ ok: true, count });
  } catch (e: any) {
    console.error("seed-designers failed:", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Internal error" });
  }
}
