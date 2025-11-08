// FILE: /pages/api/admin/approve/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminId = getSellerId(req);
  if (!adminId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({ ok: false, error: "Invalid listing ID" });
    }

    const listingRef = adminDb.collection("listings").doc(id);

    // --- THIS IS THE FIX ---
    // Change status to "Live" to match your other pages
    await listingRef.update({
      status: "Live",
      updatedAt: FieldValue.serverTimestamp(),
    });
    // ------------------------

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Approve API error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
