// FILE: /pages/api/auth/re-enable-buyer.ts
// Re-enables a disabled Firebase Auth account for a legitimate buyer/customer.
// Also re-creates the Firestore user doc if it was deleted.
// Called automatically by the buyer login page when auth/user-disabled is encountered.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required" });
  }

  if (!adminAuth) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not available" });
  }

  try {
    // 1) Verify the Firebase Auth account exists
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        return res.status(404).json({ ok: false, error: "Account not found" });
      }
      throw err;
    }

    let authRestored = false;

    // 2) Re-enable Auth if disabled
    if (authUser.disabled) {
      await adminAuth.updateUser(authUser.uid, { disabled: false });
      authRestored = true;
      console.log(`[RE-ENABLE-BUYER] Re-enabled Firebase Auth for buyer: ${email}`);
    }

    // 3) Ensure Firestore user doc exists — re-create if deleted
    let firestoreRestored = false;
    if (adminDb) {
      const snap = await adminDb
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (snap.empty) {
        // Firestore doc was deleted — re-create a minimal buyer record
        const newDocRef = adminDb.collection("users").doc(authUser.uid);
        await newDocRef.set({
          email,
          name: authUser.displayName || "",
          status: "Active",
          vipTier: "Member",
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          restoredAt: FieldValue.serverTimestamp(),
          restoredBy: "auto-login",
        });
        firestoreRestored = true;
        console.log(`[RE-ENABLE-BUYER] Re-created Firestore user doc for: ${email}`);
      } else {
        // Doc exists — make sure status is Active
        const doc = snap.docs[0];
        const data = doc.data();
        if (data.status && data.status !== "Active") {
          await doc.ref.update({
            status: "Active",
            updatedAt: FieldValue.serverTimestamp(),
          });
          firestoreRestored = true;
        }
      }
    }

    if (!authRestored && !firestoreRestored && !authUser.disabled) {
      return res.status(200).json({
        ok: true,
        restored: false,
        message: "Account already enabled",
      });
    }

    return res.status(200).json({
      ok: true,
      restored: true,
      message: authRestored
        ? "Buyer account re-enabled"
        : firestoreRestored
          ? "Buyer record restored"
          : "Account restored",
    });
  } catch (err: any) {
    console.error("[RE-ENABLE-BUYER] Error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to re-enable buyer",
    });
  }
}
