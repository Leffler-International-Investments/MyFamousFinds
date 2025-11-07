// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
};

type Start2faResponse =
  | { ok: true; challengeId: string }
  | { ok: false; error: string; message?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "Use POST." });
  }

  try {
    const body = (req.body || {}) as Start2faBody;
    const email = (body.email || "").trim().toLowerCase();
    const role = body.role || "management";

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email address is required.",
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save challenge in Firestore
    const docRef = await adminDb.collection("authChallenges").add({
      email,
      role,
      code,
      expiresAt,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send the email (does nothing if SMTP env vars missing)
    await sendLoginCode(email, code);

    return res.status(200).json({
      ok: true,
      challengeId: docRef.id,
    });
  } catch (err: any) {
    console.error("start-2fa error", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: err?.message || "Server error",
    });
  }
}
