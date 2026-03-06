import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

/**
 * RE-ENABLE a disabled Firebase Auth account.
 *
 * POST /api/management/customers/enable
 * Body: { email: string }
 *
 * This reverses the `disabled: true` flag set by Firebase Admin SDK
 * (e.g. from the remove-seller endpoint) so the user can sign in again.
 * It also resets any Firestore "Suspended" status back to "Active".
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  if (!adminAuth) {
    return res.status(500).json({ error: "Firebase Admin Auth not available" });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing email" });
    }

    const trimmed = email.trim().toLowerCase();

    // 1) Re-enable Firebase Auth account
    let reenabledAuth = false;
    try {
      const authUser = await adminAuth.getUserByEmail(trimmed);
      if (authUser.disabled) {
        await adminAuth.updateUser(authUser.uid, { disabled: false });
        reenabledAuth = true;
        console.log(`[ENABLE_CUSTOMER] Re-enabled Firebase Auth for ${trimmed}`);
      }
    } catch (authErr: any) {
      if (authErr?.code === "auth/user-not-found") {
        return res.status(404).json({ error: "No Firebase Auth account found for this email" });
      }
      throw authErr;
    }

    // 2) Also reset Firestore user status to Active if it was Suspended
    let reenabledFirestore = false;
    if (adminDb) {
      const snap = await adminDb.collection("users").where("email", "==", trimmed).limit(5).get();
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

    return res.status(200).json({
      ok: true,
      email: trimmed,
      reenabledAuth,
      reenabledFirestore,
    });
  } catch (e: any) {
    console.error("[ENABLE_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
