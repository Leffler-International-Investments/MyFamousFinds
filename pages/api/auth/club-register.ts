// FILE: /pages/api/auth/club-register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, FieldValue } from "../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!adminDb || !adminAuth) {
      return res.status(500).json({ error: "Firebase not configured" });
    }

    // 1. Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No auth token provided" });
    }
    const token = authHeader.split(" ")[1];

    // 2. Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const { name, phone } = req.body;

    // 3. Create the user document in Firestore
    const userRef = adminDb.collection("users").doc(uid);

    const newUserProfile: Record<string, any> = {
      uid: uid,
      email: email,
      name: name || "",
      // role: "customer", // We DON'T set role, to avoid overwriting "admin" or "seller"
      vipTier: "Member", // Starting tier (matches VIP system)
      points: 0,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (phone !== undefined) {
      newUserProfile.phone = phone || "";
    }

    // --- THIS IS THE CRITICAL FIX FOR YOU ---
    // Using { merge: true } ensures that if an Admin or Seller
    // registers, it ADDS the VIP fields without deleting
    // their existing admin/seller permissions.
    await userRef.set(newUserProfile, { merge: true });
    // ------------------------------------------

    res.status(201).json({ ok: true, uid: uid });
  } catch (err: any) {
    console.error("User registration API error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
