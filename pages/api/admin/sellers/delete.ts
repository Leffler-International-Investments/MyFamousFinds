import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const sessionCookie = req.cookies?.session || "";

    const idToken = token || sessionCookie;
    if (!idToken) return res.status(401).send("Missing auth");

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin =
      decoded?.isAdmin === true ||
      decoded?.uid === "Fj28JrWa8LQEzwGcZQ60rme39wP2" ||
      decoded?.uid === "hoMODWgS1zY1JAuz1dbCbnhaBki2";

    if (!isAdmin) return res.status(403).send("Forbidden");

    const { sellerId } = req.body || {};
    if (!sellerId) return res.status(400).send("Missing sellerId");

    // Look up the seller doc to get their email before deleting
    const sellerRef = adminDb.collection("sellers").doc(String(sellerId));
    const sellerSnap = await sellerRef.get();
    const sellerEmail = sellerSnap.data()?.email || String(sellerId);

    // Delete Firebase Auth account so the seller can no longer log in
    try {
      const authUser = await adminAuth.getUserByEmail(sellerEmail);
      if (authUser) {
        await adminAuth.deleteUser(authUser.uid);
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
