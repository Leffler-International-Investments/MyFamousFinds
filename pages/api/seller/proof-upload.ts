// FILE: /pages/api/seller/proof-upload.ts
// Proof of purchase upload endpoint for items over $499
// Accepts receipts, certificates, or store purchase history

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

export const config = {
  api: { bodyParser: { sizeLimit: "25mb" } },
};

type ProofUploadResponse = {
  ok: boolean;
  error?: string;
  proofId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProofUploadResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const { listingId, proofType, proofUrl, proofDescription, purchaseSource } = req.body || {};

    if (!listingId) {
      return res.status(400).json({ ok: false, error: "missing_listing_id" });
    }

    // Validate proof type
    const validProofTypes = ["receipt", "certificate", "store_history", "other"];
    const normalizedType = validProofTypes.includes(proofType) ? proofType : "other";

    // Red flag check: "don't remember" responses
    const sourceNormalized = String(purchaseSource || "").toLowerCase().trim();
    const isRedFlag =
      sourceNormalized.includes("don't remember") ||
      sourceNormalized.includes("dont remember") ||
      sourceNormalized.includes("not sure") ||
      sourceNormalized.includes("unknown") ||
      sourceNormalized === "";

    // Save proof record
    const proofRef = adminDb.collection("proofOfPurchase").doc();
    await proofRef.set({
      listingId,
      sellerId,
      proofType: normalizedType,
      proofUrl: proofUrl || "",
      proofDescription: proofDescription || "",
      purchaseSource: purchaseSource || "",
      isRedFlag,
      status: "pending_review",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update listing with proof reference and proof doc URL
    const listingUpdate: Record<string, any> = {
      proofOfPurchaseId: proofRef.id,
      proofOfPurchaseStatus: "submitted",
      proofIsRedFlag: isRedFlag,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (proofUrl) {
      listingUpdate.proof_doc_url = proofUrl;
    }
    // If proof was previously "Requested", mark it as submitted
    const listingDoc = await adminDb.collection("listings").doc(listingId).get();
    if (listingDoc.exists && listingDoc.data()?.purchase_proof === "Requested") {
      listingUpdate.purchase_proof = "Submitted";
    }
    await adminDb.collection("listings").doc(listingId).update(listingUpdate);

    return res.status(200).json({ ok: true, proofId: proofRef.id });
  } catch (err: any) {
    console.error("seller/proof-upload error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
