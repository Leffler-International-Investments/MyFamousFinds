// FILE: /pages/api/auth/buyer-signin.ts
// Server-side buyer sign-in that handles disabled accounts.
//
// Flow:
// 1. Verify password using Firebase Auth REST API (works even if disabled)
// 2. If account is disabled → re-enable it + ensure Firestore doc exists
// 3. Create a Firebase custom token so the client can sign in
//
// This bypasses the client-side auth/user-disabled error entirely.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb, FieldValue } from "../../../utils/firebaseAdmin";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

/**
 * Verify email+password via Firebase Auth REST API.
 * This works even when the account is disabled — the REST API
 * returns user data regardless of disabled status when using
 * the identitytoolkit endpoint with returnSecureToken: false.
 *
 * If disabled, the REST API returns 400 with error USER_DISABLED.
 * We treat that differently from INVALID_PASSWORD.
 */
async function verifyPasswordViaRest(
  email: string,
  password: string
): Promise<{ ok: boolean; localId?: string; isDisabled?: boolean }> {
  if (!FIREBASE_API_KEY) {
    return { ok: false };
  }

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, localId: data.localId };
    }

    // Check if the error is USER_DISABLED (password was correct but account disabled)
    const errBody = await resp.json().catch(() => ({}));
    const errMessage = errBody?.error?.message || "";

    if (errMessage === "USER_DISABLED") {
      // Password was correct but account is disabled
      return { ok: true, isDisabled: true };
    }

    // Wrong password or other error
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const trimmedEmail = String(email).trim().toLowerCase();

  if (!adminAuth) {
    return res.status(500).json({ error: "Firebase Admin not available" });
  }

  // Step 1: Verify password via REST API
  const verify = await verifyPasswordViaRest(trimmedEmail, password);

  if (!verify.ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Step 2: Get the Auth user record
  let authUser;
  try {
    authUser = await adminAuth.getUserByEmail(trimmedEmail);
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      return res.status(404).json({ error: "Account not found" });
    }
    console.error("[BUYER_SIGNIN] getUserByEmail error:", err);
    return res.status(500).json({ error: "Server error looking up account" });
  }

  // Step 3: If disabled, re-enable
  let wasDisabled = false;
  if (authUser.disabled) {
    try {
      await adminAuth.updateUser(authUser.uid, { disabled: false });
      wasDisabled = true;
      console.log(`[BUYER_SIGNIN] Re-enabled disabled account: ${trimmedEmail}`);
    } catch (err: any) {
      console.error("[BUYER_SIGNIN] Failed to re-enable:", err);
      return res.status(500).json({ error: "Failed to re-enable account" });
    }
  }

  // Step 4: Ensure Firestore user doc exists
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("users")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();

      if (snap.empty) {
        // Re-create the user doc
        const docRef = adminDb.collection("users").doc(authUser.uid);
        await docRef.set({
          email: trimmedEmail,
          name: authUser.displayName || "",
          status: "Active",
          vipTier: "Member",
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          restoredAt: FieldValue.serverTimestamp(),
          restoredBy: "auto-signin",
        });
        console.log(`[BUYER_SIGNIN] Re-created Firestore doc for: ${trimmedEmail}`);
      } else {
        // Reset status to Active if needed
        const doc = snap.docs[0];
        const data = doc.data();
        if (data.status && data.status !== "Active") {
          await doc.ref.update({
            status: "Active",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (err: any) {
      // Non-blocking — sign-in can still proceed
      console.warn("[BUYER_SIGNIN] Firestore update warning:", err?.message);
    }
  }

  // Step 5: Create a custom token for the client
  let customToken: string;
  try {
    customToken = await adminAuth.createCustomToken(authUser.uid);
  } catch (err: any) {
    console.error("[BUYER_SIGNIN] createCustomToken error:", err);
    return res.status(500).json({ error: "Failed to create sign-in token" });
  }

  return res.status(200).json({
    ok: true,
    customToken,
    uid: authUser.uid,
    email: trimmedEmail,
    displayName: authUser.displayName || "",
    wasDisabled,
  });
}
