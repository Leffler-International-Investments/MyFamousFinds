// FILE: /pages/api/auth/verify-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Verify2faBody = {
  challengeId?: string;
  code?: string;
};

type Verify2faSuccess = {
  ok: true;
  email: string;
  role: string;
};

type Verify2faFailure = {
  ok: false;
  message: string;
};

type Verify2faResponse = Verify2faSuccess | Verify2faFailure;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Verify2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, message: "Method not allowed for this endpoint." });
  }

  const { challengeId, code } = req.body as Verify2faBody;

  if (!challengeId || !code) {
    return res
      .status(400)
      .json({ ok: false, message: "Missing verification code or session." });
  }

  try {
    const docRef = adminDb.collection("login_challenges").doc(challengeId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Verification session not found." });
    }

    const data = snap.data() as any;

    if (data.used) {
      return res
        .status(400)
        .json({ ok: false, message: "This code has already been used." });
    }

    if (!data.code || String(data.code) !== String(code).trim()) {
      return res
        .status(401)
        .json({ ok: false, message: "Incorrect verification code." });
    }

    if (data.expiresAt && data.expiresAt.toMillis) {
      const expires = data.expiresAt.toMillis();
      if (Date.now() > expires) {
        return res.status(400).json({
          ok: false,
          message: "This code has expired. Please sign in again.",
        });
      }
    }

    await docRef.update({
      used: true,
      usedAt: new Date(),
    });

    return res.status(200).json({
      ok: true,
      email: data.email,
      role: data.role,
    });
  } catch (err) {
    console.error("verify_2fa_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unable to verify the code at this time." });
  }
}
