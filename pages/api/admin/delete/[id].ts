// FILE: /pages/api/admin/delete/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import { markListingDeleted } from "../../../../lib/deletedListings";
import { db } from "../../../../utils/firebaseClient";
import { doc, deleteDoc } from "firebase/firestore";

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
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

  try {
    // 1. Hard-delete from Admin Firestore
    if (isFirebaseAdminReady && adminDb) {
      try {
        await adminDb.collection("listings").doc(id).delete();
      } catch (adminErr) {
        console.warn("Admin delete (may not exist):", (adminErr as any)?.message);
      }
    }

    // 2. Hard-delete from Client Firestore (handles dual-project scenarios)
    if (db) {
      try {
        await deleteDoc(doc(db, "listings", id));
      } catch (clientErr) {
        console.warn("Client delete (may not exist):", (clientErr as any)?.message);
      }
    }

    // 3. Soft-delete for any cached homepage references
    if (isFirebaseAdminReady && adminDb) {
      await markListingDeleted(id);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting listing:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal error" });
  }
}
