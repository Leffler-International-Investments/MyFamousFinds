// /pages/api/designers.ts
// Simple admin-backed fallback for the Sell page.
// Returns active designers with minimal fields.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!adminDb) {
    return res.status(200).json({ ok: false, items: [] });
  }

  try {
    const snap = await adminDb.collection("designers").get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((d) => d && d.name && d.active !== false)
      .map((d) => ({
        id: d.id,
        name: d.name,
        isTop: !!d.isTop,
        isUpcoming: !!d.isUpcoming,
        active: d.active !== false,
      }));

    res.status(200).json({ ok: true, items });
  } catch (e: any) {
    console.error("designers api error:", e?.message || e);
    res.status(200).json({ ok: false, items: [] });
  }
}
