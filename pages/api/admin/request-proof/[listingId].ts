// FILE: /pages/api/admin/request-proof/[listingId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";

// TODO: Implement your own admin authentication logic
const isAdmin = (req: NextApiRequest): boolean => {
  // You MUST secure this endpoint before production.
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
    const { listingId } = req.query;
    if (typeof listingId !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid listing ID" });
    }

    const listingRef = adminDb.collection("listings").doc(listingId);
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

    // ------------------------------------------------------------------
    // TODO: Hook your email / notification system here.
    //
    // At this point you know:
    //   - listingId
    //   - sellerId (if stored on the listing)
    //   - sellerEmail (if stored on the listing)
    //
    // Example pseudo-logic:
    //
    // if (sellerEmail) {
    //   await sendEmail({
    //     to: sellerEmail,
    //     subject: "Famous Finds – proof of authenticity requested",
    //     text: `Hi, our team has requested additional proof of authenticity for your listing "${listingData.title}". Please reply with receipts or certificates.`,
    //   });
    // }
    //
    // Or: create a Firestore notification in a "notifications" collection.
    // ------------------------------------------------------------------

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
