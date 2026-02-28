import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Verify management session — any authorised management team member can toggle
  if (!requireAdmin(req, res)) return;

  try {
    const { sellerId, status } = req.body || {};
    if (!sellerId || !status) return res.status(400).json({ error: "Missing sellerId/status" });

    await adminDb.collection("sellers").doc(String(sellerId)).update({
      status: String(status),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
