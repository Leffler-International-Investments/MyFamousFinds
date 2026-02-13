// FILE: /pages/api/admin/delete-public-listing/[id].ts
// Deletes a listing using the Admin SDK (bypasses Firestore security rules).
// The Admin SDK is configured to target the same project as the client SDK
// (NEXT_PUBLIC_FIREBASE_PROJECT_ID), so it deletes from the same Firestore
// the homepage reads from.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin SDK not initialized" });
  }

  try {
    await adminDb.collection("listings").doc(id).delete();
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Admin SDK delete failed:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message || "Delete failed" });
  }
}
