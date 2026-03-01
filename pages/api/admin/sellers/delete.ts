import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { adminAuth as firebaseAdminAuth } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  // Verify management session — any authorised management team member can delete
  if (!requireAdmin(req, res)) return;

  try {
    const { sellerId } = req.body || {};
    if (!sellerId) return res.status(400).send("Missing sellerId");

    // Look up the seller doc to get their email before deleting
    const sellerRef = adminDb.collection("sellers").doc(String(sellerId));
    const sellerSnap = await sellerRef.get();
    const sellerEmail = sellerSnap.data()?.email || String(sellerId);

    // Delete Firebase Auth account so the seller can no longer log in
    try {
      const authUser = await firebaseAdminAuth.getUserByEmail(sellerEmail);
      if (authUser) {
        await firebaseAdminAuth.deleteUser(authUser.uid);
        console.log(`[DELETE_SELLER] Removed Firebase Auth for ${sellerEmail}`);
      }
    } catch (authErr: any) {
      // user may not exist in Auth — that's fine, continue with Firestore deletion
      if (authErr?.code !== "auth/user-not-found") {
        console.warn(`[DELETE_SELLER] Could not remove Auth user for ${sellerEmail}:`, authErr?.message);
      }
    }

    // Delete Firestore seller document
    await sellerRef.delete();

    // Also delete the seller agreement if it exists
    try {
      await adminDb.collection("seller_agreements").doc(sellerEmail).delete();
    } catch (_) { /* ignore */ }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message || "Server error");
  }
}
