import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  try {
    const { customerId } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "Missing customerId" });

    const userRef = adminDb.collection("users").doc(String(customerId));
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const userEmail = userSnap.data()?.email || "";

    // Delete Firebase Auth account so the customer can no longer log in
    if (userEmail) {
      try {
        const authUser = await adminAuth.getUserByEmail(userEmail);
        if (authUser) {
          await adminAuth.deleteUser(authUser.uid);
        }
      } catch (authErr: any) {
        if (authErr?.code !== "auth/user-not-found") {
          console.warn(`[DELETE_CUSTOMER] Could not remove Auth user for ${userEmail}:`, authErr?.message);
        }
      }
    }

    // Delete Firestore user document
    await userRef.delete();

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE_CUSTOMER]", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
