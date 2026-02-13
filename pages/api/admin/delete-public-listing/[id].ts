// FILE: /pages/api/admin/delete-public-listing/[id].ts
// Deletes a listing using the client SDK (same Firestore the homepage reads from).
// Falls back to admin SDK if client SDK fails.

import type { NextApiRequest, NextApiResponse } from "next";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../utils/firebaseClient";
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

  // Try client SDK first (same data source as homepage)
  if (db) {
    try {
      await deleteDoc(doc(db, "listings", id));
      return res.status(200).json({ ok: true });
    } catch (clientErr: any) {
      console.warn("Client SDK delete failed, trying admin SDK:", clientErr?.message);
    }
  }

  // Fallback to admin SDK
  if (adminDb) {
    try {
      await adminDb.collection("listings").doc(id).delete();
      return res.status(200).json({ ok: true });
    } catch (adminErr: any) {
      console.error("Admin SDK delete also failed:", adminErr?.message);
      return res.status(500).json({ ok: false, error: adminErr?.message || "Delete failed" });
    }
  }

  return res.status(500).json({ ok: false, error: "No Firebase SDK available" });
}
