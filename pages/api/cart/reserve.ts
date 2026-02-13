// FILE: /pages/api/cart/reserve.ts
// 15-minute cart reservation system
// Reserves an item for the buyer, auto-releases after timeout

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

const RESERVATION_MINUTES = 15;

type ReserveResponse = {
  ok: boolean;
  error?: string;
  reservedUntil?: number;
  alreadyReserved?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReserveResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { listingId, action } = req.body || {};
  if (!listingId) {
    return res.status(400).json({ ok: false, error: "missing_listing_id" });
  }

  try {
    const reservationRef = adminDb.collection("cartReservations").doc(listingId);
    const reservationSnap = await reservationRef.get();
    const now = Date.now();

    if (action === "release") {
      // Manual release
      if (reservationSnap.exists) {
        const data = reservationSnap.data() as any;
        if (data.userId === userId) {
          await reservationRef.delete();

          // Move item to saved items
          const cartDocId = `${userId}_${listingId}`;
          const cartSnap = await adminDb.collection("buyerCartItems").doc(cartDocId).get();
          if (cartSnap.exists) {
            const cartData = cartSnap.data() as any;
            await adminDb.collection("buyerSavedItems").doc(cartDocId).set(
              {
                userId,
                listingId,
                title: cartData.title || "",
                brand: cartData.brand || "",
                price: cartData.price || 0,
                currency: cartData.currency || "USD",
                imageUrl: cartData.imageUrl || "",
                savedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
            await adminDb.collection("buyerCartItems").doc(cartDocId).delete();
          }
        }
      }
      return res.status(200).json({ ok: true });
    }

    // Reserve action
    if (reservationSnap.exists) {
      const existingData = reservationSnap.data() as any;
      const reservedUntil = existingData.reservedUntil || 0;

      // Check if reservation is still active
      if (reservedUntil > now) {
        if (existingData.userId === userId) {
          // User already has this reserved
          return res.status(200).json({ ok: true, reservedUntil });
        }
        // Someone else has it reserved
        return res.status(409).json({
          ok: false,
          error: "item_reserved_by_another",
          alreadyReserved: true,
          reservedUntil,
        });
      }
      // Reservation expired — can be overwritten
    }

    const reservedUntil = now + RESERVATION_MINUTES * 60 * 1000;

    await reservationRef.set({
      listingId,
      userId,
      reservedAt: now,
      reservedUntil,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, reservedUntil });
  } catch (err: any) {
    console.error("cart/reserve error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
