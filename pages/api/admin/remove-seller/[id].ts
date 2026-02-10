// FILE: /pages/api/admin/remove-seller/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  isFirebaseAdminReady,
  FieldValue,
} from "../../../../utils/firebaseAdmin";

type Ok = { ok: true; updatedListings: number };
type Err = { error: string };
type Resp = Ok | Err;

/**
 * REMOVE SELLER (soft remove)
 * ---------------------------
 * - Sets sellers/{sellerId}.status = "Removed"
 * - Hides the seller's listings by setting listings.status = "Removed"
 *
 * IMPORTANT:
 * We intentionally DO NOT use orderBy(...) here to avoid requiring a composite index.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({
      error:
        "Firebase Admin is not configured. Missing FIREBASE_SERVICE_ACCOUNT_JSON (or split FB_* env vars).",
    });
  }

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Missing seller id" });
    }

    const sellerId = String(id);

    const reason =
      typeof (req.body as any)?.reason === "string"
        ? String((req.body as any).reason).trim()
        : "";

    const sellerRef = adminDb.collection("sellers").doc(sellerId);
    const sellerSnap = await sellerRef.get();
    if (!sellerSnap.exists) {
      return res.status(404).json({ error: "Seller record not found" });
    }

    // 1) Soft-remove seller
    await sellerRef.set(
      {
        status: "Removed",
        removedAt: FieldValue.serverTimestamp(),
        removedReason: reason || null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // 2) Fetch seller listings WITHOUT orderBy (avoids composite index requirement)
    const listingsSnap = await adminDb
      .collection("listings")
      .where("sellerId", "==", sellerId)
      .get();

    let updatedListings = 0;

    // Firestore batch limit = 500 writes. Use safe chunk size.
    const CHUNK = 450;
    const docs = listingsSnap.docs;

    for (let i = 0; i < docs.length; i += CHUNK) {
      const slice = docs.slice(i, i + CHUNK);
      const batch = adminDb.batch();

      slice.forEach((d) => {
        batch.set(
          d.ref,
          {
            status: "Removed",
            removedAt: FieldValue.serverTimestamp(),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      });

      await batch.commit();
      updatedListings += slice.length;
    }

    return res.status(200).json({ ok: true, updatedListings });
  } catch (err: any) {
    console.error("remove_seller_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
