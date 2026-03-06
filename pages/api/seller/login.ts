// FILE: /pages/api/seller/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type LoginPayload = {
  email?: string;
  password?: string;
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

/**
 * Verify password via Firebase Auth REST API (same approach as management login).
 */
async function verifyFirebaseAuthPassword(
  email: string,
  password: string
): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return false;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: false,
        }),
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
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

  const { email, password } = req.body as LoginPayload;

  if (!email) {
    return res.status(400).json({
      ok: false,
      code: "bad_credentials",
      message: "Email is required.",
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const isSuperSeller = SUPER_SELLER_EMAILS.has(trimmedEmail);

  // If Firebase Admin is not configured, still allow SUPER sellers with password check
  if (!isFirebaseAdminReady || !adminDb) {
    if (isSuperSeller) {
      if (password) {
        // Check env-var passwords or Firebase Auth REST API
        const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const adminPassword = String(process.env.ADMIN_PASSWORD || "");
        const envMatch =
          (adminEmail === trimmedEmail && adminPassword === password) ||
          (process.env.MANAGEMENT_DAN_PASSWORD && trimmedEmail === "leffleryd@gmail.com" && process.env.MANAGEMENT_DAN_PASSWORD === password) ||
          (process.env.MANAGEMENT_ARIEL_PASSWORD && trimmedEmail === "arich1114@aol.com" && process.env.MANAGEMENT_ARIEL_PASSWORD === password) ||
          (process.env.MANAGEMENT_ITAI_PASSWORD && trimmedEmail === "itai.leff@gmail.com" && process.env.MANAGEMENT_ITAI_PASSWORD === password);

        if (envMatch) {
          return res.status(200).json({ ok: true, sellerId: "super-seller" });
        }

        const firebaseOk = await verifyFirebaseAuthPassword(trimmedEmail, password);
        if (firebaseOk) {
          return res.status(200).json({ ok: true, sellerId: "super-seller" });
        }

        return res.status(401).json({
          ok: false,
          code: "bad_credentials",
          message: "Incorrect email or password.",
        });
      }
      // Password is required for all users including super sellers
      return res.status(401).json({
        ok: false,
        code: "bad_credentials",
        message: "Password is required.",
      });
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

    // Try underscore-format doc ID (apply path: email.replace(/\./g, "_"))
    if (!sellerSnap.exists) {
      const underscoreId = trimmedEmail.replace(/\./g, "_");
      if (underscoreId !== trimmedEmail) {
        sellerSnap = await adminDb.collection("sellers").doc(underscoreId).get();
      }
    }

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

    // Verify password server-side (same as management login)
    if (password) {
      // Super sellers can also use env-var passwords
      if (isSuperSeller) {
        const envPasswords: { email: string; password: string }[] = [];
        const legacyAriel = String(process.env.SELLER_ARIEL_PASSWORD || process.env.MANAGEMENT_ARIEL_PASSWORD || "");
        if (legacyAriel) envPasswords.push({ email: "arich1114@aol.com", password: legacyAriel });
        const legacyItai = String(process.env.SELLER_ITAI_PASSWORD || process.env.MANAGEMENT_ITAI_PASSWORD || "");
        if (legacyItai) envPasswords.push({ email: "itai.leff@gmail.com", password: legacyItai });
        const legacyDan = String(process.env.SELLER_DAN_PASSWORD || process.env.MANAGEMENT_DAN_PASSWORD || "");
        if (legacyDan) envPasswords.push({ email: "leffleryd@gmail.com", password: legacyDan });
        const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const adminPassword = String(process.env.ADMIN_PASSWORD || "");
        if (adminEmail && adminPassword) envPasswords.push({ email: adminEmail, password: adminPassword });

        const envMatch = envPasswords.find(
          (c) => c.email === trimmedEmail && c.password === password
        );
        if (envMatch) {
          return res.status(200).json({ ok: true, sellerId });
        }
      }

      // Check password via Firebase Auth REST API
      const firebaseOk = await verifyFirebaseAuthPassword(trimmedEmail, password);
      if (firebaseOk) {
        return res.status(200).json({ ok: true, sellerId });
      }

      return res.status(401).json({
        ok: false,
        code: "bad_credentials",
        message: "Incorrect email or password.",
      });
    }

    // Password is required — no legacy passwordless login
    return res.status(401).json({
      ok: false,
      code: "bad_credentials",
      message: "Password is required.",
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
