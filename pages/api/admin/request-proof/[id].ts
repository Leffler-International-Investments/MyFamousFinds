// FILE: /pages/api/admin/request-proof/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  try {
    const ref = adminDb.collection("listings").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    await ref.set(
      {
        purchase_proof: "Requested",
        proofRequestedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
        updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Request proof error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to request proof" });
  }
}
