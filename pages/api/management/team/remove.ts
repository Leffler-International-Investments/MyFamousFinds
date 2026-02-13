// FILE: /pages/api/management/team/remove.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing member id." });
    }

    // Delete from Firestore
    await adminDb.collection("management_team").doc(id).delete();

    // Delete from Firebase Auth (best-effort — may not exist if stub)
    try {
      const auth = getAuth();
      await auth.deleteUser(id);
    } catch (authErr: any) {
      // If user doesn't exist in Auth, that's fine — still remove from Firestore
      if (authErr.code !== "auth/user-not-found") {
        console.warn("Could not delete Auth user:", authErr.message);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error removing team member:", err);
    return res.status(500).json({ ok: false, error: err?.message || "An internal error occurred." });
  }
}
