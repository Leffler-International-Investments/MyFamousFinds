import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

/**
 * ADD a new buyer account (for management staff or anyone who should skip
 * the normal registration flow).
 *
 * POST /api/management/customers/add-buyer
 * Body: { email: string, name?: string, password?: string }
 *
 * - If the email already exists in Firebase Auth → reuses that account.
 * - If not → creates a new Auth account with the provided (or temp) password.
 * - Ensures a Firestore "users" doc exists with status "Active".
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  if (!adminAuth) {
    return res.status(500).json({ error: "Firebase Admin Auth not available" });
  }

  try {
    const { email, name, password } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" });
    }

    const trimmed = email.trim().toLowerCase();
    const result: Record<string, any> = { email: trimmed };

    // --- Step 1: Get or create Firebase Auth user ---
    let authUser: any = null;
    let authAction = "none";

    try {
      authUser = await adminAuth.getUserByEmail(trimmed);

      // If the account is disabled, re-enable it
      if (authUser.disabled) {
        await adminAuth.updateUser(authUser.uid, { disabled: false });
        authAction = "re-enabled";
      } else {
        authAction = "existing";
      }
    } catch (authErr: any) {
      if (authErr?.code === "auth/user-not-found") {
        // Create a new Auth account
        const pw = password || `Temp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}!`;
        authUser = await adminAuth.createUser({
          email: trimmed,
          displayName: name || "",
          password: pw,
          disabled: false,
        });
        authAction = "created";
      } else {
        throw authErr;
      }
    }

    result.authAction = authAction;
    result.uid = authUser?.uid || null;

    // --- Step 2: Ensure Firestore user doc exists ---
    let firestoreAction = "none";

    if (adminDb) {
      const snap = await adminDb.collection("users").where("email", "==", trimmed).limit(1).get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        if (data.status !== "Active") {
          await doc.ref.update({
            status: "Active",
            updatedAt: FieldValue.serverTimestamp(),
          });
          firestoreAction = "reactivated";
        } else {
          firestoreAction = "already-exists";
        }
      } else {
        // Create a new buyer record
        const newDocRef = adminDb.collection("users").doc(authUser?.uid || trimmed);
        await newDocRef.set({
          email: trimmed,
          name: name || authUser?.displayName || "",
          status: "Active",
          vipTier: "Member",
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          addedBy: "management",
        });
        firestoreAction = "created";
      }
    }

    result.firestoreAction = firestoreAction;
    result.ok = true;

    // Build a human-readable message
    const msgs: string[] = [];
    if (authAction === "created") msgs.push("Firebase Auth account created");
    if (authAction === "re-enabled") msgs.push("Firebase Auth account re-enabled");
    if (authAction === "existing") msgs.push("Firebase Auth account already exists");
    if (firestoreAction === "created") msgs.push("Buyer record created");
    if (firestoreAction === "reactivated") msgs.push("Existing buyer record reactivated");
    if (firestoreAction === "already-exists") msgs.push("Buyer record already exists");
    if (authAction === "created" && !password) {
      msgs.push("User must reset password via 'Forgot password'");
    }
    result.message = msgs.join(". ");

    console.log(`[ADD_BUYER] Added ${trimmed}: auth=${authAction}, firestore=${firestoreAction}`);

    return res.status(200).json(result);
  } catch (e: any) {
    console.error("[ADD_BUYER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
