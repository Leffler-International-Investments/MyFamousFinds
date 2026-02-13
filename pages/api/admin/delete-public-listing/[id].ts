// FILE: /pages/api/admin/delete-public-listing/[id].ts
// Soft-deletes a listing from the homepage by storing its ID in the Admin
// SDK's own Firestore.  The homepage query filters these IDs out.

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { markListingDeleted } from "../../../../lib/deletedListings";

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

  try {
    await markListingDeleted(id);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error marking listing as deleted:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message || "Delete failed" });
  }
}
