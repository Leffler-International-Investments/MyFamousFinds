// FILE: /pages/api/management/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

type LoginPayload = {
  email?: string;
  password?: string;
};

type LoginResponse =
  | { ok: true; managementId: string }
  | {
      ok: false;
      code: "pending" | "not_authorised" | "bad_credentials";
      message: string;
    };

// Example env:
// MANAGEMENT_SUPER_EMAILS="leffleryd@gmail.com,owner@famousfinds.com"
const SUPER_EMAILS = (process.env.MANAGEMENT_SUPER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      code: "bad_credentials",
      message: "Method not allowed.",
    });
  }

  const { email, password } = (req.body || {}) as LoginPayload;

  const trimmedEmail = (email || "").toLowerCase().trim();
  const trimmedPassword = (password || "").trim();

  if (!trimmedEmail || !trimmedPassword) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email and password are required.",
    });
  }

  const isSuperAdmin = SUPER_EMAILS.includes(trimmedEmail);

  try {
    const snap = await adminDb
      .collection("managementAdmins")
      .where("email", "==", trimmedEmail)
      .limit(1)
      .get();

    if (snap.empty) {
      if (!isSuperAdmin) {
        return res.status(400).json({
          ok: false,
          code: "not_authorised",
          message:
            "We couldn’t find a management admin account for that email.",
        });
      }

      // Auto-create approved management record for super admins.
      const docRef = adminDb.collection("managementAdmins").doc();
      await docRef.set({
        email: trimmedEmail,
        status: "approved",
        isSuperAdmin: true,
        password: trimmedPassword,
        createdAt: FieldValue.serverTimestamp(),
        notes:
          "Bootstrap management admin created automatically from /api/management/login.",
      });

      return res.status(200).json({
        ok: true,
        managementId: docRef.id,
      });
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      status?: string;
      password?: string;
      isSuperAdmin?: boolean;
    };

    if (!data.password || data.password !== trimmedPassword) {
      return res.status(400).json({
        ok: false,
        code: "bad_credentials",
        message: "Incorrect email or password.",
      });
    }

    if (data.status && data.status !== "approved") {
      return res.status(400).json({
        ok: false,
        code: "pending",
        message:
          "Your management access is still under review. We'll email you as soon as it is approved.",
      });
    }

    return res.status(200).json({
      ok: true,
      managementId: doc.id,
    });
  } catch (err) {
    console.error("management_login_api_error", err);
    return res.status(500).json({
      ok: false,
      code: "bad_credentials",
      message: "Unexpected server error. Please try again.",
    });
  }
}
