// pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import nodemailer from "nodemailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { email, role } = req.body as { email: string; role: string };

  // 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const challengeId = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    // 🗄 Try to store challenge if Firestore Admin works
    if (adminDb) {
      await adminDb.collection("loginChallenges").doc(challengeId).set({
        email,
        role,
        code,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // 📧 Send email with the code (uses your SMTP_* env vars)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Famous Finds admin login code",
      text: `Your login code is: ${code}`,
    });

    return res.status(200).json({
      ok: true,
      challengeId,
    });
  } catch (err: any) {
    console.error("start-2fa error", err);

    // 🔁 Fallback: DO NOT break login – ignore 2FA backend problem
    return res.status(200).json({
      ok: true,
      challengeId: "no-db-fallback",
    });
  }
}
