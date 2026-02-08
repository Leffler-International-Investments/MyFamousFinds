// FILE: /pages/api/seller/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type LoginPayload = {
  email?: string;
  password?: string; // kept for backward compatibility (ignored)
};

type LoginResponse =
  | { ok: true; sellerId: string }
  | {
      ok: false;
      code: "apply_first" | "pending" | "bad_credentials" | "server_not_configured";
      message: string;
    };

// Owners / super sellers (always allowed)
const SUPER_SELLER_EMAILS = new Set<string>([
  "leffleryd@gmail.com", // Dan
  "arich1114@aol.com", // Ariel
  "arichspot@gmail.com",
  "ariel@arichwines.com",
  "arielspot@gmail.com",
  "itai.leff@gmail.com",
]);

function isApprovedStatus(status: unknown) {
  const s = String(status || "").trim().toLowerCase();
  return s === "approved";
}

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

  const { email } = req.body as LoginPayload;

  if (!email) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email is required.",
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const isSuperSeller = SUPER_SELLER_EMAILS.has(trimmedEmail);

  // If Firebase Admin is not configured, still allow SUPER sellers
  if (!isFirebaseAdminReady || !adminDb) {
    if (isSuperSeller) {
      return res.status(200).json({ ok: true, sellerId: "super-seller" });
    }
    return res.status(500).json({
      ok: false,
      code: "server_not_configured",
      message:
        "Server is not configured (missing Firebase Admin env vars). Please set FB_PROJECT_ID / FB_CLIENT_EMAIL / FB_PRIVATE_KEY in Vercel.",
    });
  }

  try {
    // Find seller in sellers collection (doc id could be email, or stored in fields)
    let sellerSnap: any = await adminDb
      .collection("sellers")
      .doc(trimmedEmail)
      .get();

    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    // If not found:
    if (!sellerSnap.exists) {
      if (!isSuperSeller) {
        return res.status(400).json({
          ok: false,
          code: "apply_first",
          message:
            "We couldn’t find a seller application for that email. Please apply to become a seller first.",
        });
      }

      // Super seller fallback: create approved doc so login can proceed
      await adminDb.collection("sellers").doc(trimmedEmail).set(
        {
          email: trimmedEmail,
          contactEmail: trimmedEmail,
          status: "Approved",
          isSuperSeller: true,
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true, sellerId: trimmedEmail });
    }

    const data = sellerSnap.data ? sellerSnap.data() : {};
    const sellerId = sellerSnap.id || trimmedEmail;

    // Super sellers are always approved
    if (isSuperSeller && !isApprovedStatus(data.status)) {
      await sellerSnap.ref.set(
        { status: "Approved", isSuperSeller: true },
        { merge: true }
      );
      data.status = "Approved";
    }

    if (!isApprovedStatus(data.status)) {
      return res.status(403).json({
        ok: false,
        code: "pending",
        message:
          "Your seller application is still under review. You’ll be notified once approved.",
      });
    }

    // ✅ IMPORTANT CHANGE:
    // We do NOT verify passwords here anymore (Firebase Auth handles that on the client).
    return res.status(200).json({ ok: true, sellerId });
  } catch (err) {
    console.error("seller_login_api_error", err);
    return res.status(500).json({
      ok: false,
      code: "bad_credentials",
      message: "Unexpected server error. Please try again.",
    });
  }
}
