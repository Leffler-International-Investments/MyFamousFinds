// FILE: /pages/api/admin/update-seller-email/[id].ts
// Admin-only endpoint that rewires a listing to a different seller email.
// White-glove service often uploads items under the team email, then reassigns
// to the real customer so they receive "sold" / "new offer" notifications.
//
// Notification lookups (see pages/api/offers/create.ts, pages/api/paypal/capture-order.ts)
// load `sellers/{sellerId}` and read `email` / `contactEmail` off that doc.
// sellerId is itself the normalized email, so we update both the listing's
// sellerId/sellerEmail and the sellers doc in one step.

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";

type ApiResponse = { ok: true; sellerId: string } | { ok: false; error: string };

function normalizeEmail(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not ready" });
  }

  const { email } = req.body || {};
  const newEmail = normalizeEmail(email);
  if (!isValidEmail(newEmail)) {
    return res.status(400).json({ ok: false, error: "Please provide a valid email address" });
  }

  try {
    const listingRef = adminDb.collection("listings").doc(id);
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const now = new Date();

    await listingRef.update({
      sellerId: newEmail,
      sellerEmail: newEmail,
      updatedAt: now,
    });

    // Ensure the sellers/{newEmail} doc exists so notification lookups
    // by sellerId resolve to a real record.
    const sellerRef = adminDb.collection("sellers").doc(newEmail);
    const sellerSnap = await sellerRef.get();
    if (!sellerSnap.exists) {
      await sellerRef.set(
        {
          email: newEmail,
          contactEmail: newEmail,
          createdAt: now,
          updatedAt: now,
          status: "Pending",
        },
        { merge: true }
      );
    } else {
      // Backfill the email field if missing so lookups still work.
      const data: any = sellerSnap.data() || {};
      if (!data.email || !data.contactEmail) {
        await sellerRef.set(
          {
            email: data.email || newEmail,
            contactEmail: data.contactEmail || newEmail,
            updatedAt: now,
          },
          { merge: true }
        );
      }
    }

    return res.status(200).json({ ok: true, sellerId: newEmail });
  } catch (err: any) {
    console.error("[update-seller-email]", err);
    return res.status(500).json({ ok: false, error: err?.message || "Update failed" });
  }
}
