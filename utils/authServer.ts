// FILE: /utils/authServer.ts

import type { NextApiRequest } from "next";
import { adminAuth, adminDb } from "./firebaseAdmin";

export type AuthUser = {
  uid: string;
  email?: string;
};

function readBearerToken(req: NextApiRequest): string {
  const h = req.headers["authorization"];
  const raw = Array.isArray(h) ? h[0] : h;
  const v = String(raw || "").trim();
  if (!v) return "";
  if (v.toLowerCase().startsWith("bearer ")) return v.slice(7).trim();
  return v;
}

/**
 * ✅ SERVER-VERIFIED AUTH (Firebase ID token)
 *
 * Clients must send a Firebase ID token using:
 *   Authorization: Bearer <idToken>
 */
export async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  if (!adminAuth) return null;
  const token = readBearerToken(req);
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (
      decoded.email ||
      (decoded as any)?.firebase?.identities?.email?.[0] ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();
    return { uid: decoded.uid, ...(email ? { email } : {}) };
  } catch {
    return null;
  }
}

/**
 * ✅ Seller identity MUST be derived from verified token.
 *
 * FIX:
 * - login API finds sellers using 3 lookups (docId, email field, contactEmail field)
 * - old getSellerId only checked docId(email) → could 401 after successful login
 * - now mirrors the same 3-step lookup and returns the actual seller doc id
 */
export async function getSellerId(req: NextApiRequest): Promise<string | null> {
  const user = await getAuthUser(req);
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return null;
  if (!adminDb) return null;

  try {
    // 1) doc id = email
    let sellerSnap: any = await adminDb.collection("sellers").doc(email).get();

    // 2) where email == ...
    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    // 3) where contactEmail == ...
    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", email)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    if (!sellerSnap.exists) return null;

    const sellerId = String(sellerSnap.id || "").trim();
    return sellerId || null;
  } catch {
    return null;
  }
}

/**
 * ✅ Buyer identity MUST be derived from verified token.
 */
export async function getUserId(req: NextApiRequest): Promise<string | null> {
  const user = await getAuthUser(req);
  return user?.uid || null;
}
