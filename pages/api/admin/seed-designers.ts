// FILE: /pages/api/admin/seed-designers.ts
// One-time / repeatable seeder for the "designers" collection.
// Auth: provide header x-admin-key that equals process.env.ADMIN_SEED_KEY
// Body accepts either { designers: string[] } OR { text: "Chanel\nGucci\n..." }

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

type Resp =
  | { ok: true; upserted: number }
  | { ok: false; error: string };

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
  // Only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Simple header secret
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    // Accept array or newline text
    let names: string[] | null = null;
    if (Array.isArray((req.body as any)?.designers)) {
      names = (req.body as any).designers as string[];
    } else if (typeof (req.body as any)?.text === "string") {
      names = (req.body as any).text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!names || !names.length) {
      names = DEFAULT_DESIGNERS;
    }

    const batch = adminDb.batch();
    let count = 0;

    for (const raw of names) {
      const name = String(raw || "").trim();
      if (!name) continue;
      const slug = slugify(name);

      const ref = adminDb.collection("designers").doc(slug);
      batch.set(
        ref,
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

    if (count === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "no_valid_names" });
    }

    await batch.commit();
    return res.status(200).json({ ok: true, upserted: count });
  } catch (e: any) {
    console.error("seed-designers:", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "failed" });
  }
}
