// FILE: /pages/api/admin/delete/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { markListingDeleted } from "../../../../lib/deletedListings";

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
    // Hard-delete the listing document from Firestore
    await adminDb.collection("listings").doc(id).delete();
    // Also soft-delete for any cached homepage references
    await markListingDeleted(id);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting listing:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal error" });
  }
}
