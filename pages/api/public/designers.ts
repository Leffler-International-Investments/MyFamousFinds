// FILE: /pages/api/public/designers.ts
// Admin-backed list of designers for dropdowns.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type D = { id: string; name: string; slug?: string };
type ApiOk = { ok: true; designers: D[] };
type ApiErr = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    const onlyApproved =
      String(req.query.approved || "").toLowerCase() === "true";

    // ✅ No composite index needed: order by name, then filter in code.
    const col = adminDb.collection("designers");
    const snap = await col.orderBy("name", "asc").limit(2000).get();

    const designers: D[] = snap.docs
      .map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: String(data?.name ?? d.id),
          slug: data?.slug ?? undefined,
          approved: !!data?.approved,
        } as any;
      })
      .filter((d) => (onlyApproved ? d.approved : true))
      .map(({ id, name, slug }) => ({ id, name, slug }));

    res.status(200).json({ ok: true, designers });
  } catch (e: any) {
    console.error("Designers API failed:", e);
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
