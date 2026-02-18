// FILE: /pages/api/management/support-ticket-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { adminDb } from "../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireAdmin(req, res)) return;

  const { ticketId, status } = req.body || {};

  if (!ticketId || !["Open", "Closed"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid ticket ID or status." });
  }

  try {
    await adminDb.collection("supportTickets").doc(ticketId).update({ status });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[SUPPORT] Status update failed:", err);
    return res.status(500).json({ ok: false, error: "Failed to update ticket." });
  }
}
