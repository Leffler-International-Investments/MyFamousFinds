import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

/**
 * RESTORE a deleted or disabled customer account.
 *
 * POST /api/management/customers/restore
 * Body: { email: string, name?: string }
 *
 * This handles ALL cases:
 * 1. Auth exists + disabled → re-enable Auth, restore/create Firestore doc
 * 2. Auth exists + enabled → just restore/create Firestore doc if missing
 * 3. Auth deleted entirely → re-create Auth account (password-reset required),
 *    restore/create Firestore doc
 * 4. Firestore doc exists but status is "Deleted"/"Suspended" → reset to Active
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
    const result: Record<string, any> = { email: trimmed };

    // --- Step 1: Handle Firebase Auth ---
    let authUser: any = null;
    let authAction = "none";

    try {
      authUser = await adminAuth.getUserByEmail(trimmed);

      if (authUser.disabled) {
        // Case 1: Auth exists but disabled → re-enable
        await adminAuth.updateUser(authUser.uid, { disabled: false });
        authAction = "re-enabled";
      } else {
        // Case 2: Auth exists and already enabled
        authAction = "already-enabled";
      }
    } catch (authErr: any) {
      if (authErr?.code === "auth/user-not-found") {
        // Case 3: Auth was fully deleted → re-create with a random temp password
        // The user will need to use "Forgot password" to set a new one
        const tempPassword = `Temp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}!`;
        authUser = await adminAuth.createUser({
          email: trimmed,
          displayName: name || "",
          password: tempPassword,
          disabled: false,
        });
        authAction = "re-created";
      } else {
        throw authErr;
      }
    }

    result.authAction = authAction;
    result.uid = authUser?.uid || null;

    // --- Step 2: Handle Firestore user doc ---
    let firestoreAction = "none";

    if (adminDb) {
      const snap = await adminDb.collection("users").where("email", "==", trimmed).limit(1).get();

      if (!snap.empty) {
        // Doc exists — reset status to Active
        const doc = snap.docs[0];
        const data = doc.data();
        if (data.status !== "Active") {
          await doc.ref.update({
            status: "Active",
            updatedAt: FieldValue.serverTimestamp(),
          });
          firestoreAction = "status-reset-to-active";
        } else {
          firestoreAction = "already-active";
        }
      } else {
        // Doc was deleted — re-create a minimal user record
        const newDocRef = adminDb.collection("users").doc(authUser?.uid || trimmed);
        await newDocRef.set({
          email: trimmed,
          name: name || authUser?.displayName || "",
          status: "Active",
          vipTier: "Member",
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          restoredAt: FieldValue.serverTimestamp(),
          restoredBy: "management",
        });
        firestoreAction = "re-created";
      }
    }

    result.firestoreAction = firestoreAction;
    result.ok = true;

    // Build a human-readable message
    const msgs: string[] = [];
    if (authAction === "re-enabled") msgs.push("Firebase Auth account re-enabled");
    if (authAction === "re-created") msgs.push("Firebase Auth account re-created (user must reset password via 'Forgot password')");
    if (authAction === "already-enabled") msgs.push("Firebase Auth was already enabled");
    if (firestoreAction === "status-reset-to-active") msgs.push("Firestore status reset to Active");
    if (firestoreAction === "re-created") msgs.push("Firestore user record re-created");
    if (firestoreAction === "already-active") msgs.push("Firestore record was already Active");
    result.message = msgs.join(". ");

    console.log(`[RESTORE_CUSTOMER] Restored ${trimmed}: auth=${authAction}, firestore=${firestoreAction}`);

    return res.status(200).json(result);
  } catch (e: any) {
    console.error("[RESTORE_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
