// FILE: /pages/api/public/designers.ts
// Admin-backed list of designers for dropdowns.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import type { Query } from "firebase-admin/firestore";

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

    const col = adminDb.collection("designers");
    let q: Query = col;
    if (onlyApproved) q = q.where("approved", "==", true);
    q = q.orderBy("name", "asc").limit(2000);

    const snap = await q.get();
    const designers: D[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: String(data?.name ?? d.id),
        slug: data?.slug || undefined,
      };
    });

    res.status(200).json({ ok: true, designers });
  } catch (e: any) {
    console.error("Designers API failed:", e);
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
