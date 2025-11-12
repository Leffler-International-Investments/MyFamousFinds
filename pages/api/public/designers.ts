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

    const col = adminDb.collection("designers");

    // ✅ Avoid composite-index requirement:
    // If filtering by approved, do not orderBy in Firestore; sort in memory.
    let designers: D[] = [];
    if (onlyApproved) {
      const snap = await col.where("approved", "==", true).limit(2000).get();
      designers = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, name: String(data?.name || ""), slug: data?.slug };
      });
      designers.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const snap = await col.orderBy("name", "asc").limit(2000).get();
      designers = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, name: String(data?.name || ""), slug: data?.slug };
      });
    }

    res.status(200).json({ ok: true, designers });
  } catch (e: any) {
    console.error("Designers API failed:", e);
    res
      .status(500)
      .json({ ok: false, error: e?.message || "failed" });
  }
}
