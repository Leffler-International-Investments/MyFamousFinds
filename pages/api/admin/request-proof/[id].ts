// FILE: /pages/api/admin/request-proof/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing listing id" });
  }

  try {
    const ref = adminDb.collection("listings").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    await ref.update({
      purchase_proof: "Requested",
      proofRequestedAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Request proof error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to request proof" });
  }
}
