// FILE: /pages/api/admin/seed-designers.ts
// One-time seeder for "designers" collection.
// Protect via header: x-admin-key == process.env.ADMIN_SEED_KEY

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

const DEFAULT_DESIGNERS = [
  "Chanel",
  "Gucci",
  "Hermès",
  "Louis Vuitton",
  "Prada",
  "Dior",
  "Celine",
  "Saint Laurent",
  "Rolex",
  "Cartier",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  try {
    const key = req.headers["x-admin-key"];
    if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const input: string[] =
      (Array.isArray(req.body?.designers) ? req.body.designers : null) ||
      DEFAULT_DESIGNERS;

    const batch = adminDb.batch();
    let count = 0;

    for (const nameRaw of input) {
      const name = String(nameRaw || "").trim();
      if (!name) continue;

      const slug = slugify(name);
      const docRef = adminDb.collection("designers").doc(slug);

      batch.set(
        docRef,
        {
          name,
          slug,
          approved: true,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      count++;
    }

    if (count === 0)
      return res.status(400).json({ ok: false, error: "no designers provided" });

    await batch.commit();
    return res.status(200).json({ ok: true, upserted: count });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
