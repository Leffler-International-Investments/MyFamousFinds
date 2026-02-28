// FILE: /pages/api/admin/designers/[id].ts
// DELETE: remove by doc id (slug). Optional PUT to rename.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type Resp = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_SEED_KEY || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ ok: false, error: "missing_id" });

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    if (req.method === "DELETE") {
      await adminDb.collection("designers").doc(id).delete();
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PUT") {
      const name = String((req.body as any)?.name || "").trim();
      if (!name) return res.status(400).json({ ok: false, error: "missing_name" });
      await adminDb.collection("designers").doc(id).set({ name }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "DELETE, PUT");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
