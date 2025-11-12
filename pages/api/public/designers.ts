// FILE: /pages/api/public/designers.ts
// Public: return designers for dropdowns (no composite index required)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type D = { id: string; name: string; slug: string; active?: boolean };
type ApiOk = { ok: true; designers: D[] };
type ApiErr = { ok: false; error: string };

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    // Single-field index only: orderBy('name') — then filter in memory
    const snap = await adminDb
      .collection("designers")
      .orderBy("name", "asc")
      .limit(2000)
      .get();

    const designers = snap.docs
      .map((d) => {
        const data = d.data() as any;
        const active =
          typeof data.active === "boolean"
            ? data.active
            : typeof data.approved === "boolean"
            ? data.approved
            : true; // default true for your manual docs

        return {
          id: d.id,
          name: String(data.name ?? d.id),
          slug: (data.slug as string) || d.id,
          active,
        } as D;
      })
      .filter((d) => d.active);

    res.status(200).json({ ok: true, designers });
  } catch (e: any) {
    console.error("Designers API failed:", e);
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
