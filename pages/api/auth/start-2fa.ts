// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management" | "buyer";
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
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  let challengeId = "";
  try {
    const body = req.body as Start2faBody;
    const email = body.email?.trim().toLowerCase();
    const role: "seller" | "management" | "buyer" =
      body.role || "buyer";

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email is required.",
      });
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();

    const docRef = adminDb.collection("authChallenges").doc();
    challengeId = docRef.id;

    await docRef.set({
      email,
      role,
      code,
      createdAt: FieldValue.serverTimestamp(),
      used: false,
    });

    try {
      // tolerant – if emailing fails we still let login continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sendLoginCode as any)(email, code, role);
    } catch (err) {
      console.error("[start-2fa] sendLoginCode error", err);
    }

    return res.status(200).json({ ok: true, challengeId });
  } catch (err) {
    console.error("[start-2fa] error", err);
    // final fallback – don't hard-block login
    return res.status(200).json({ ok: true, challengeId: challengeId || "" });
  }
}
