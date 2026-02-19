import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  // Verify management session — any authorised management team member can toggle
  if (!requireAdmin(req, res)) return;

  try {
    const { sellerId, status } = req.body || {};
    if (!sellerId || !status) return res.status(400).send("Missing sellerId/status");

    await adminDb.collection("sellers").doc(String(sellerId)).update({
      status: String(status),
      updatedAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message || "Server error");
  }
}
