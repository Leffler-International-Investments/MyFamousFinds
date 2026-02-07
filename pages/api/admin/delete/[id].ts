// FILE: /pages/api/admin/delete/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type ApiResponse =
  | { ok: true }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // listing-queue uses POST; we also allow DELETE for flexibility
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "Missing listing id" });
  }

  try {
    // Physically remove the listing document
    await adminDb.collection("listings").doc(id).delete();

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error deleting listing", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to delete listing",
    });
  }
}

