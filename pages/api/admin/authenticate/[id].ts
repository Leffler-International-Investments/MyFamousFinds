// FILE: /pages/api/admin/authenticate/[id].ts
// Saves an Entrupy-style authentication result for a listing.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ error: "Firebase Admin not initialized." });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing listing id" });
  }

  const {
    verdict,
    confidence,
    certificateNumber,
    checklist,
    notes,
    authenticatedBy,
  } = req.body || {};

  if (!verdict || !["Authentic", "Not Authentic", "Inconclusive"].includes(verdict)) {
    return res.status(400).json({ error: "Invalid verdict. Must be Authentic, Not Authentic, or Inconclusive." });
  }

  try {
    const listingRef = adminDb.collection("listings").doc(id);
    const snap = await listingRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const now = new Date();

    // Save authentication record
    const authRecord = {
      listingId: id,
      verdict,
      confidence: typeof confidence === "number" ? confidence : null,
      certificateNumber: certificateNumber || null,
      checklist: checklist || {},
      notes: notes || "",
      authenticatedBy: authenticatedBy || "admin",
      createdAt: now,
    };

    const authRef = await adminDb.collection("authentications").add(authRecord);

    // Update listing with authentication result
    await listingRef.set(
      {
        authenticationStatus: verdict,
        authenticationId: authRef.id,
        authenticationCertificate: certificateNumber || null,
        authenticatedAt: now,
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true, authenticationId: authRef.id });
  } catch (err: any) {
    console.error("authenticate listing error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
