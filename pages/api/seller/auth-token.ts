// FILE: /pages/api/seller/auth-token.ts
/**
 * Lightweight endpoint to issue a Firebase custom token for an approved seller.
 *
 * Used by sellerClient.ts to recover the Firebase Auth session when
 * auth.currentUser is null (e.g. after page refresh or if the initial
 * signInWithCustomToken during login failed silently).
 *
 * Security:
 * - Only works for sellers with status "Approved" in Firestore
 * - The returned custom token is scoped to that seller's Firebase Auth UID
 * - All downstream API endpoints still verify seller status independently
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type AuthTokenResponse =
  | { ok: true; firebaseToken: string }
  | { ok: false; error: string };

function isApprovedStatus(status: unknown): boolean {
  const s = String(status || "").trim().toLowerCase();
  return s === "approved" || s === "active";
}

/**
 * In-memory rate limiter: max `limit` requests per `windowMs` per key.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthTokenResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  if (!isFirebaseAdminReady || !adminDb || !adminAuth) {
    return res.status(503).json({ ok: false, error: "Firebase not configured" });
  }

  // Rate limit: max 5 requests per minute per IP to prevent abuse
  const ip = String(
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]) ||
      req.socket?.remoteAddress ||
      "unknown"
  ).split(",")[0].trim();

  if (!checkRateLimit(`auth-token:${ip}`, 5, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Try again later." });
  }

  const { email } = (req.body || {}) as { email?: string };
  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return res.status(400).json({ ok: false, error: "Valid email required" });
  }

  // Also rate-limit per email to prevent enumeration
  if (!checkRateLimit(`auth-token:email:${trimmedEmail}`, 3, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests for this email. Try again later." });
  }

  try {
    // 4-way seller lookup (mirrors getSellerId in authServer.ts)
    let sellerSnap: any = await adminDb.collection("sellers").doc(trimmedEmail).get();

    if (!sellerSnap.exists) {
      const underscoreId = trimmedEmail.replace(/\./g, "_");
      if (underscoreId !== trimmedEmail) {
        sellerSnap = await adminDb.collection("sellers").doc(underscoreId).get();
      }
    }

    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      return res.status(404).json({ ok: false, error: "Seller not found" });
    }

    const data = sellerSnap.data ? sellerSnap.data() : {};
    if (!isApprovedStatus(data.status) && !data.isSuperSeller) {
      return res.status(403).json({ ok: false, error: "Seller not approved" });
    }

    // Ensure a Firebase Auth user exists for this email
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(trimmedEmail);
      uid = userRecord.uid;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({ email: trimmedEmail });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    const firebaseToken = await adminAuth.createCustomToken(uid);
    return res.status(200).json({ ok: true, firebaseToken });
  } catch (err: any) {
    console.error("[auth-token] Error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}
