// FILE: /pages/api/auth/verify-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  adminAuth,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { verifyChallenge } from "../../../utils/twofaStore";
import { setAdminSessionCookie } from "../../../utils/adminSession";

type Verify2faBody = {
  challengeId?: string;
  code?: string;
};

type Verify2faResponse =
  | { ok: true; firebaseToken?: string }
  | { ok: false; error: string; message?: string };

/**
 * After successful 2FA, ensure the user has a Firebase Auth account and
 * return a custom token so the client can establish a Firebase Auth session.
 * This is critical for seller API calls (sellerFetch uses Bearer tokens).
 */
async function generateFirebaseCustomToken(
  email: string | undefined
): Promise<string | undefined> {
  if (!adminAuth || !email) return undefined;

  try {
    let uid: string;

    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;

      // Re-enable disabled accounts after successful 2FA verification.
      // The user already proved their identity (password + 2FA code),
      // so it's safe to re-enable. Without this, signInWithCustomToken
      // fails on the client for disabled accounts.
      if (userRecord.disabled) {
        await adminAuth.updateUser(uid, { disabled: false });
        console.log(`[verify-2fa] Re-enabled disabled Firebase Auth account for ${email} (uid=${uid})`);
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create a Firebase Auth user so the client can get ID tokens
        const newUser = await adminAuth.createUser({ email });
        uid = newUser.uid;
        console.log(`[verify-2fa] Created Firebase Auth user for ${email} (uid=${uid})`);
      } else {
        throw err;
      }
    }

    const token = await adminAuth.createCustomToken(uid);
    return token;
  } catch (err) {
    console.warn("[verify-2fa] Failed to generate Firebase custom token:", err);
    return undefined;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Verify2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  const { challengeId, code } = (req.body || {}) as Verify2faBody;

  if (!challengeId || !code) {
    return res.status(400).json({
      ok: false,
      error: "missing_fields",
      message: "challengeId and code are required",
    });
  }

  // 1) Try Firestore when configured
  if (isFirebaseAdminReady && adminDb) {
    try {
      const docRef = adminDb.collection("loginChallenges").doc(challengeId);
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data() as {
          code: string;
          used?: boolean;
          role?: string;
          email?: string;
        };

        if (data.used) {
          return res.status(401).json({
            ok: false,
            error: "already_used",
            message: "Code already used",
          });
        }

        if (data.code !== code) {
          return res.status(401).json({
            ok: false,
            error: "invalid_code",
            message: "Invalid code",
          });
        }

        await docRef.update({
          used: true,
          usedAt: FieldValue.serverTimestamp(),
        });

        // Set admin session cookie for management logins
        if (data.role === "management" && data.email) {
          setAdminSessionCookie(res, data.email);
        }

        // Generate Firebase custom token so the client can establish
        // a Firebase Auth session (needed for Bearer tokens in sellerFetch)
        const firebaseToken = await generateFirebaseCustomToken(data.email);

        return res
          .status(200)
          .json({ ok: true, ...(firebaseToken ? { firebaseToken } : {}) });
      }
    } catch (err) {
      console.error(
        "[verify-2fa] Firestore verify failed; falling back to in-memory",
        err
      );
    }
  }

  // 2) In-memory fallback
  const mem = verifyChallenge({ id: challengeId, code });
  if (!mem.ok) {
    const message =
      mem.reason === "invalid_code"
        ? "Invalid code"
        : mem.reason === "expired"
        ? "Code expired"
        : mem.reason === "already_used"
        ? "Code already used"
        : "Challenge not found";
    return res.status(400).json({ ok: false, error: mem.reason, message });
  }

  // Set admin session cookie for management logins (in-memory path)
  if (mem.role === "management" && mem.email) {
    setAdminSessionCookie(res, mem.email);
  }

  // Generate Firebase custom token (in-memory path)
  const firebaseToken = await generateFirebaseCustomToken(mem.email);

  return res
    .status(200)
    .json({ ok: true, ...(firebaseToken ? { firebaseToken } : {}) });
}
