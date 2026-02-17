// FILE: /pages/api/admin/proof-doc/[id].ts
// Lazy-loads a listing's proof document data on demand (avoids base64 in SSR props).

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb } from "../../../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing listing id" });
  }

  try {
    const doc = await adminDb.collection("listings").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const data = doc.data() || {};
    const proofDocUrl = String(data.proof_doc_url || "");

    return res.status(200).json({ ok: true, proof_doc_url: proofDocUrl });
  } catch (err: any) {
    console.error("proof-doc fetch error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
