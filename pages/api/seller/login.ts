// FILE: /pages/api/seller/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

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

// Bootstrap list of super sellers who should always have full access
// Ariel and Dan can log in as sellers even if they haven't gone through
// the standard seller application flow.
const SUPER_SELLER_EMAILS = new Set<string>([
  "leffleryd@gmail.com",      // Dan
  "arich1114@aol.com",        // Ariel
]);

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
  const isSuperSeller = SUPER_SELLER_EMAILS.has(trimmedEmail);

  try {
    // 1) Look up seller by email
    const snap = await adminDb
      .collection("sellers")
      .where("email", "==", trimmedEmail)
      .limit(1)
      .get();

    if (snap.empty) {
      // If this is Ariel or Dan, auto-create an approved seller record
      if (isSuperSeller) {
        const docRef = adminDb.collection("sellers").doc();

        await docRef.set({
          email: trimmedEmail,
          password,
          status: "approved",
          isSuperSeller: true,
          createdAt: FieldValue.serverTimestamp(),
          vettingNotes:
            "Bootstrap super seller created automatically from /api/seller/login.",
        });

        return res.status(200).json({
          ok: true,
          sellerId: docRef.id,
        });
      }

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
    if (isSuperSeller && data.status !== "approved") {
      // Make sure Ariel and Dan are always fully approved sellers
      await doc.ref.update({
        status: "approved",
        isSuperSeller: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      data.status = "approved";
    }

    if (!data.status || data.status !== "approved") {
      return res.status(403).json({
        ok: false,
        code: "pending",
        message:
          "Your seller application is still under review. You’ll be notified once approved.",
      });
    }

    // 3) Check password (for production, change to hashed passwords).
    // Super sellers (Ariel & Dan) can always log in once their email is recognised.
    if (!isSuperSeller && (!data.password || data.password !== password)) {
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
