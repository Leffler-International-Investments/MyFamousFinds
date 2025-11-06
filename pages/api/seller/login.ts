// FILE: /pages/api/seller/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type LoginPayload = {
  email?: string;
  password?: string;
};

type LoginResponse =
  | { ok: true; sellerId: string }
  | {
      ok: false;
      code: "apply_first" | "pending" | "bad_credentials";
      message: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      code: "bad_credentials",
      message: "Method not allowed.",
    });
  }

  const { email, password } = req.body as LoginPayload;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email and password are required.",
    });
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    // 1) Look up seller by email
    const snap = await adminDb
      .collection("sellers")
      .where("email", "==", trimmedEmail)
      .limit(1)
      .get();

    if (snap.empty) {
      // No seller in DB → must apply first
      return res.status(400).json({
        ok: false,
        code: "apply_first",
        message:
          "We couldn’t find a seller account for that email. Please apply to become a seller first.",
      });
    }

    const doc = snap.docs[0];
    const data = doc.data() as any;

    // 2) Enforce vetting/approval
    if (!data.status || data.status !== "approved") {
      return res.status(403).json({
        ok: false,
        code: "pending",
        message:
          "Your seller application is still under review. You’ll be notified once approved.",
      });
    }

    // 3) Check password (for production, change to hashed passwords)
    if (!data.password || data.password !== password) {
      return res.status(401).json({
        ok: false,
        code: "bad_credentials",
        message: "Incorrect email or password.",
      });
    }

    // 4) Success
    return res.status(200).json({
      ok: true,
      sellerId: doc.id,
    });
  } catch (err) {
    console.error("seller_login_api_error", err);
    return res.status(500).json({
      ok: false,
      code: "bad_credentials",
      message: "Unexpected server error. Please try again.",
    });
  }
}
