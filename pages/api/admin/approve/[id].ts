// FILE: /pages/api/admin/approve/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing listing id" });
  }

  try {
    await adminDb.collection("listings").doc(id).set({ status: "Live" }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("approve listing error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
