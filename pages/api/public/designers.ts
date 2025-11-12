// FILE: /pages/api/public/designers.ts
// Returns designers list using Firebase Admin. Works even if client rules are strict.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin"; // <-- path fixed for /pages/api/public/*

type D = { id: string; name: string; slug?: string };
type ApiOk = { ok: true; designers: D[] };
type ApiErr = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    // Optional switch: ?approved=true to only return approved designers
    const onlyApproved = String(req.query.approved || "").toLowerCase() === "true";

    let ref = adminDb.collection("designers");
    if (onlyApproved) ref = ref.where("approved", "==", true);
    const snap = await ref.orderBy("name", "asc").limit(2000).get();

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
