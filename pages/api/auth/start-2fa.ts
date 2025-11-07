// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
  method?: "sms" | "email";
  phone?: string;
};

type Start2faSuccess = {
  ok: true;
  challengeId: string;
  via: "sms" | "email";
  devCode?: string;
};

type Start2faFailure = {
  ok: false;
  message: string;
};

type Start2faResponse = Start2faSuccess | Start2faFailure;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, message: "Method not allowed for this endpoint." });
  }

  const { email, role, method, phone } = req.body as Start2faBody;

  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail || !role) {
    return res
      .status(400)
      .json({ ok: false, message: "Missing email or role for 2FA." });
  }

  let via: "sms" | "email" = "email";
  if (method === "sms" && phone && phone.trim()) {
    via = "sms";
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  try {
    const docRef = await adminDb.collection("login_challenges").add({
      email: normalizedEmail,
      role,
      via,
      phone: via === "sms" ? phone || null : null,
      code,
      createdAt: now,
      expiresAt,
      used: false,
    });

    // TODO: Plug in real SMS / email providers here (Twilio, SendGrid, etc.)
    console.log(
      `[2FA] Login code for ${role} user ${normalizedEmail} via ${via}: ${code}`
    );

    const response: Start2faSuccess = {
      ok: true,
      challengeId: docRef.id,
      via,
    };

    if (process.env.NEXT_PUBLIC_SHOW_2FA_CODE === "true") {
      response.devCode = code;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("start_2fa_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unable to start verification step." });
  }
}
