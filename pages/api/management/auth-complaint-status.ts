// FILE: /pages/api/management/auth-complaint-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  const { complaintId, status } = req.body || {};

  if (!complaintId || !["Open", "Closed"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid request." });
  }

  try {
    await adminDb
      .collection("authenticationComplaints")
      .doc(complaintId)
      .update({ status });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[AUTH-COMPLAINT-STATUS] Update failed:", err);
    return res.status(500).json({ ok: false, error: "Update failed." });
  }
}
