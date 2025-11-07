// FILE: /pages/api/seller/listings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer"; // Adjust path if needed

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Get Seller ID from their session
  const sellerId = getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // 2. Get the Listing ID from the URL
  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Invalid listing ID" });
  }

  const docRef = adminDb.collection("listings").doc(id);

  if (req.method === "DELETE") {
    try {
      // 3. Security Check: Verify this seller owns this item
      const docSnap = await docRef.get();
      
      // --- THIS IS THE FIX ---
      // Changed from docSnap.exists() to docSnap.exists
      if (!docSnap.exists) {
        return res.status(404).json({ ok: false, error: "Listing not found" });
      }

      const docData = docSnap.data();
      if (docData?.sellerId !== sellerId) {
        // This is not their item!
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      // 4. Safe to delete
      await docRef.delete();
      return res.status(200).json({ ok: true });

    } catch (err: any) {
      console.error("Delete listing error:", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
