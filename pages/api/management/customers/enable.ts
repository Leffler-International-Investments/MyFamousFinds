import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

/**
 * RE-ENABLE a disabled or deleted Firebase Auth account.
 *
 * POST /api/management/customers/enable
 * Body: { email: string, name?: string }
 *
 * Handles all cases:
 * - Auth exists + disabled → re-enable
 * - Auth exists + enabled → no-op for Auth
 * - Auth fully deleted → re-create Auth (user must use "Forgot password")
 * - Firestore doc missing → re-create minimal buyer record
 * - Firestore status != Active → reset to Active
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  if (!adminAuth) {
    return res.status(500).json({ error: "Firebase Admin Auth not available" });
  }

  try {
    const { email, name } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" });
    }

    const trimmed = email.trim().toLowerCase();

    // 1) Handle Firebase Auth
    let reenabledAuth = false;
    let recreatedAuth = false;
    let authUid = "";

    try {
      const authUser = await adminAuth.getUserByEmail(trimmed);
      authUid = authUser.uid;
      if (authUser.disabled) {
        await adminAuth.updateUser(authUser.uid, { disabled: false });
        reenabledAuth = true;
        console.log(`[ENABLE_CUSTOMER] Re-enabled Firebase Auth for ${trimmed}`);
      }
    } catch (authErr: any) {
      if (authErr?.code === "auth/user-not-found") {
        // Auth was fully deleted — re-create with temp password
        const tempPassword = `Temp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}!`;
        const newUser = await adminAuth.createUser({
          email: trimmed,
          displayName: name || "",
          password: tempPassword,
          disabled: false,
        });
        authUid = newUser.uid;
        recreatedAuth = true;
        console.log(`[ENABLE_CUSTOMER] Re-created Firebase Auth for ${trimmed}`);
      } else {
        throw authErr;
      }
    }

    // 2) Handle Firestore user doc
    let reenabledFirestore = false;
    let recreatedFirestore = false;

    if (adminDb) {
      const snap = await adminDb.collection("users").where("email", "==", trimmed).limit(5).get();

      if (snap.empty) {
        // Firestore doc was deleted — re-create
        const docRef = adminDb.collection("users").doc(authUid || trimmed);
        await docRef.set({
          email: trimmed,
          name: name || "",
          status: "Active",
          vipTier: "Member",
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          restoredAt: FieldValue.serverTimestamp(),
          restoredBy: "management",
        });
        recreatedFirestore = true;
      } else {
        for (const doc of snap.docs) {
          const data = doc.data();
          if (data.status && data.status !== "Active") {
            await doc.ref.update({
              status: "Active",
              updatedAt: FieldValue.serverTimestamp(),
            });
            reenabledFirestore = true;
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      email: trimmed,
      reenabledAuth,
      recreatedAuth,
      reenabledFirestore,
      recreatedFirestore,
      message: recreatedAuth
        ? "Auth account re-created. User must use 'Forgot password' to set a new password."
        : reenabledAuth
          ? "Auth account re-enabled."
          : "Account already enabled.",
    });
  } catch (e: any) {
    console.error("[ENABLE_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
