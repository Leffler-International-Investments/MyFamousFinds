// FILE: /pages/api/admin/authenticate/[id].ts
// Saves an AI-assisted authentication result for a listing.
// Supports the expanded verification flow with AI scoring, reference matching,
// mismatch warnings, and category group tracking.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

const VALID_VERDICTS = [
  "Authentic",
  "Not Authentic",
  "Inconclusive",
  "Request More Proof",
  "Needs Expert Review",
];

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
    aiFindings,
    authenticatedBy,
    // New AI-assisted fields
    aiEnabled,
    aiRecommendation,
    aiConfidence,
    imageMatchConfidence,
    metadataMatchConfidence,
    riskBand,
    categoryUsed,
    selectedCategoryGroup,
    mismatchWarnings,
    matchedReferenceId,
    matchedReferenceTitle,
    matchedReferenceBrand,
    topReferenceCandidates,
    extractedSignals,
    aiImageSignals,
    aiMetadataSignals,
    listingSnapshot,
  } = req.body || {};

  if (!verdict || !VALID_VERDICTS.includes(verdict)) {
    return res.status(400).json({
      error: `Invalid verdict. Must be one of: ${VALID_VERDICTS.join(", ")}`,
    });
  }

  try {
    const listingRef = adminDb.collection("listings").doc(id);
    const snap = await listingRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const now = new Date();

    // Save authentication record with AI-assisted fields
    const authRecord: Record<string, any> = {
      listingId: id,
      verdict,
      confidence: typeof confidence === "number" ? confidence : null,
      certificateNumber: certificateNumber || null,
      checklist: checklist || {},
      notes: notes || "",
      aiFindings: aiFindings || null,
      authenticatedBy: authenticatedBy || "admin",
      createdAt: now,
      // AI-assisted fields
      aiEnabled: aiEnabled === true,
      aiRecommendation: aiRecommendation || null,
      aiConfidence: typeof aiConfidence === "number" ? aiConfidence : null,
      imageMatchConfidence: typeof imageMatchConfidence === "number" ? imageMatchConfidence : null,
      metadataMatchConfidence: typeof metadataMatchConfidence === "number" ? metadataMatchConfidence : null,
      riskBand: riskBand || null,
      categoryUsed: categoryUsed || null,
      selectedCategoryGroup: selectedCategoryGroup || null,
      mismatchWarnings: Array.isArray(mismatchWarnings) ? mismatchWarnings : [],
      matchedReferenceId: matchedReferenceId || null,
      matchedReferenceTitle: matchedReferenceTitle || null,
      matchedReferenceBrand: matchedReferenceBrand || null,
      topReferenceCandidates: Array.isArray(topReferenceCandidates) ? topReferenceCandidates : [],
      extractedSignals: extractedSignals || null,
      aiImageSignals: aiImageSignals || null,
      aiMetadataSignals: aiMetadataSignals || null,
      listingSnapshot: listingSnapshot || null,
    };

    const authRef = await adminDb.collection("authentications").add(authRecord);

    // Update listing with authentication result + AI fields
    const listingUpdate: Record<string, any> = {
      authenticationStatus: verdict,
      authenticationId: authRef.id,
      authenticationCertificate: certificateNumber || null,
      authenticatedAt: now,
      authenticationConfidence: typeof aiConfidence === "number" ? aiConfidence : (typeof confidence === "number" ? confidence : null),
      authenticationRiskBand: riskBand || null,
      authenticationCategoryGroup: selectedCategoryGroup || null,
      authenticationAiRecommendation: aiRecommendation || null,
      authenticationMatchedReferenceId: matchedReferenceId || null,
      verificationStage: "completed",
      verificationReviewedInQueue: true,
    };

    await listingRef.set(listingUpdate, { merge: true });

    return res.status(200).json({ ok: true, authenticationId: authRef.id });
  } catch (err: any) {
    console.error("authenticate listing error", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
