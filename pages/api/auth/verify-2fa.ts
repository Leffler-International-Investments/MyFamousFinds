// FILE: /pages/api/auth/verify-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { verifyChallenge } from "../../../utils/twofaStore";

type Verify2faBody = {
  challengeId?: string;
  code?: string;
};

type Verify2faResponse =
  | { ok: true }
  | { ok: false; error: string; message?: string };

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
  const backdoorCode = process.env.ADMIN_BACKDOOR_CODE || "";

  // ✅ Immediate backdoor: if code matches env, always succeed
  if (code && backdoorCode && code === backdoorCode) {
    return res.status(200).json({ ok: true });
  }

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
        const data = snap.data() as { code: string; used?: boolean };

        if (data.used) {
          return res.status(400).json({
            ok: false,
            error: "already_used",
            message: "Code already used",
          });
        }

        if (data.code !== code) {
          return res.status(400).json({
            ok: false,
            error: "invalid_code",
            message: "Invalid code",
          });
        }

        await docRef.update({
          used: true,
          usedAt: FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ ok: true });
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

  return res.status(200).json({ ok: true });
}
