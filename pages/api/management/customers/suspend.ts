import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    const { customerId, status } = req.body || {};
    if (!customerId || !status) return res.status(400).json({ error: "Missing customerId or status" });

    const allowed = ["Active", "Suspended"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Status must be Active or Suspended" });
    }

    await adminDb.collection("users").doc(String(customerId)).update({
      status: String(status),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[SUSPEND_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
