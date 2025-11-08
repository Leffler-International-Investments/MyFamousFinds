// FILE: /pages/api/admin/request-proof/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
// --- THIS IS THE FIX ---
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
// ----------------------

// TODO: Implement your own admin authentication logic
const isAdmin = (req: NextApiRequest): boolean => {
  console.log("Admin check bypassed in request-proof. TODO: Secure this endpoint!");
  return true;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed" });
  }

  if (!isAdmin(req)) {
    return res
      .status(401)
      .json({ error: "Unauthorized" });
  }

  try {
    // --- UPDATED: to use 'id' to match the filename ---
    const { id } = req.query;
    if (typeof id !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid listing ID" });
    }

    const listingRef = adminDb.collection("listings").doc(id);
    // ----------------------------------------------------
    
    const snap = await listingRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listingData = snap.data() || {};
    const sellerId = listingData.sellerId || null;
    const sellerEmail = listingData.sellerEmail || null;

    // Mark proof requested in Firestore
    await listingRef.update({
      proofRequested: true,
      proofRequestedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // TODO: Hook your email / notification system here.
    
    return res.status(200).json({
      ok: true,
      message: "Proof requested and flag saved.",
    });
  } catch (err: any) {
    console.error("request-proof error", err);
    return res
      .status(500)
      .json({ error: err.message || "Server error" });
  }
}
