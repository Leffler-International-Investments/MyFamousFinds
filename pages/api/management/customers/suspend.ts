import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    const { customerId, status, email } = req.body || {};
    if (!customerId || !status) return res.status(400).json({ error: "Missing customerId or status" });

    const allowed = ["Active", "Suspended"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Status must be Active or Suspended" });
    }

    const isSuspending = status === "Suspended";
    let updatedFirestore = false;
    let updatedAuth = false;
    let resolvedEmail = email ? String(email).trim().toLowerCase() : "";

    // 1) Update Firestore user document
    if (adminDb) {
      const docRef = adminDb.collection("users").doc(String(customerId));
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        resolvedEmail = resolvedEmail || (docSnap.data()?.email || "").toLowerCase().trim();
        await docRef.update({
          status: String(status),
          updatedAt: FieldValue.serverTimestamp(),
        });
        updatedFirestore = true;
      }
    }

    // 2) Disable/enable Firebase Auth account
    if (adminAuth && resolvedEmail) {
      try {
        const authUser = await adminAuth.getUserByEmail(resolvedEmail);
        if (isSuspending && !authUser.disabled) {
          await adminAuth.updateUser(authUser.uid, { disabled: true });
          updatedAuth = true;
        } else if (!isSuspending && authUser.disabled) {
          await adminAuth.updateUser(authUser.uid, { disabled: false });
          updatedAuth = true;
        }
      } catch (authErr: any) {
        if (authErr?.code !== "auth/user-not-found") {
          console.warn(`[SUSPEND_CUSTOMER] Auth update failed for ${resolvedEmail}:`, authErr?.message);
        }
      }
    }

    if (!updatedFirestore && !updatedAuth) {
      return res.status(404).json({ error: "Customer not found in Firestore or Firebase Auth" });
    }

    return res.status(200).json({ ok: true, updatedFirestore, updatedAuth });
  } catch (e: any) {
    console.error("[SUSPEND_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
