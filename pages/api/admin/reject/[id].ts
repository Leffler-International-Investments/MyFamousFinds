// FILE: /pages/api/admin/reject/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
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
      status: "Rejected",
      rejectedAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Reject listing error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to reject item" });
  }
}
