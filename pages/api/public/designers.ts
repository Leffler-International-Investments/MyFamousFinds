// FILE: /pages/api/public/designers.ts
// Returns approved designers for public dropdowns.
// Uses the Firebase Admin SDK so it works regardless of client rules.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type ApiOk = { ok: true; designers: { id: string; name: string; slug?: string }[] };
type ApiErr = { ok: false; error: string };

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    const snap = await adminDb
      .collection("designers")
      .orderBy("name", "asc")
      .limit(1000)
      .get();

    const designers = snap.docs.map((d) => {
      const data = d.data() as any;
      return { id: d.id, name: String(data.name || d.id), slug: data.slug || undefined };
    });

    res.status(200).json({ ok: true, designers });
  } catch (e: any) {
    console.error("Designers API failed:", e);
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
