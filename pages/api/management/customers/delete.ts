import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    const { customerId, email } = req.body || {};

    // Support delete by Firestore doc ID or by email address
    if (!customerId && !email) {
      return res.status(400).json({ error: "Missing customerId or email" });
    }

    let deletedFirestore = false;
    let deletedAuth = false;
    let resolvedEmail = email ? String(email).trim().toLowerCase() : "";

    // --- Delete Firestore user document ---
    if (customerId) {
      const userRef = adminDb.collection("users").doc(String(customerId));
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        resolvedEmail = resolvedEmail || (userSnap.data()?.email || "").toLowerCase().trim();
        await userRef.delete();
        deletedFirestore = true;
      }
    }

    // If deleting by email and no customerId, search for the doc by email
    if (!deletedFirestore && resolvedEmail) {
      const snap = await adminDb.collection("users").where("email", "==", resolvedEmail).limit(5).get();
      for (const doc of snap.docs) {
        await doc.ref.delete();
        deletedFirestore = true;
      }
    }

    // --- Delete Firebase Auth account ---
    if (resolvedEmail) {
      try {
        const authUser = await adminAuth.getUserByEmail(resolvedEmail);
        if (authUser) {
          await adminAuth.deleteUser(authUser.uid);
          deletedAuth = true;
        }
      } catch (authErr: any) {
        if (authErr?.code !== "auth/user-not-found") {
          console.warn(`[DELETE_CUSTOMER] Could not remove Auth user for ${resolvedEmail}:`, authErr?.message);
        }
      }
    }

    if (!deletedFirestore && !deletedAuth) {
      return res.status(404).json({ error: "Customer not found in Firestore or Firebase Auth" });
    }

    return res.status(200).json({
      ok: true,
      deletedFirestore,
      deletedAuth,
      email: resolvedEmail,
    });
  } catch (e: any) {
    console.error("[DELETE_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
