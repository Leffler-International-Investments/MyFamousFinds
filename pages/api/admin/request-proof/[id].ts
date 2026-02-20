// FILE: /pages/api/admin/request-proof/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";
import { sendProofRequestEmail } from "../../../../utils/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  try {
    const ref = adminDb.collection("listings").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing = snap.data() || {};

    await ref.set(
      {
        purchase_proof: "Requested",
        proofRequestedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
        updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
      },
      { merge: true }
    );

    // Look up the seller's email so we can notify them
    const sellerId = String(
      listing.sellerId || listing.sellerEmail || listing.seller || ""
    );
    const itemTitle = listing.title || "Untitled listing";

    let sellerEmail = "";
    let sellerName = "";

    if (sellerId) {
      try {
        // Try by doc ID first, then by email field, then by contactEmail
        let sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
        if (!sellerDoc.exists) {
          const byEmail = await adminDb
            .collection("sellers")
            .where("email", "==", sellerId)
            .limit(1)
            .get();
          if (!byEmail.empty) sellerDoc = byEmail.docs[0];
        }
        if (!sellerDoc.exists) {
          const byContact = await adminDb
            .collection("sellers")
            .where("contactEmail", "==", sellerId)
            .limit(1)
            .get();
          if (!byContact.empty) sellerDoc = byContact.docs[0];
        }

        if (sellerDoc.exists) {
          const sellerData = sellerDoc.data() || {};
          sellerEmail = String(
            sellerData.contactEmail || sellerData.email || sellerId
          );
          sellerName = String(
            sellerData.businessName ||
              sellerData.contactName ||
              sellerData.displayName ||
              ""
          );
        } else if (sellerId.includes("@")) {
          sellerEmail = sellerId;
        }
      } catch (err) {
        console.error("[request-proof] Seller lookup failed:", err);
        // Fall back to sellerId if it looks like an email
        if (sellerId.includes("@")) sellerEmail = sellerId;
      }
    }

    // Send the proof request email to the seller
    if (sellerEmail && sellerEmail.includes("@")) {
      try {
        await sendProofRequestEmail({
          to: sellerEmail,
          sellerName: sellerName || undefined,
          itemTitle,
          listingId: id,
        });
        console.log(
          `[request-proof] Email sent to ${sellerEmail} for listing ${id}`
        );
      } catch (err) {
        console.error("[request-proof] Email send failed:", err);
        // Don't fail the request — the Firestore update already succeeded
      }
    } else {
      console.warn(
        `[request-proof] No valid seller email found for listing ${id} (sellerId=${sellerId})`
      );
    }

    return res.status(200).json({ ok: true, emailSent: Boolean(sellerEmail) });
  } catch (err: any) {
    console.error("Request proof error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to request proof" });
  }
}
