// FILE: /pages/api/seller/setup-password.ts
// Allows approved sellers to set up their Firebase Auth password.
// Only works for emails that exist in the sellers collection with approved status.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../../utils/firebaseAdmin";

type Resp =
  | { ok: true }
  | { ok: false; code: string; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, code: "method", message: "Method not allowed." });
  }

  if (!adminDb || !adminAuth) {
    return res.status(500).json({
      ok: false,
      code: "server",
      message: "Firebase Admin is not configured.",
    });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      ok: false,
      code: "bad_input",
      message: "A valid email address is required.",
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      ok: false,
      code: "bad_input",
      message: "Password must be at least 8 characters.",
    });
  }

  try {
    // Find the seller in the sellers collection (3-step lookup like login)
    let sellerSnap: any = await adminDb
      .collection("sellers")
      .doc(email)
      .get();

    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", email)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      return res.status(403).json({
        ok: false,
        code: "not_seller",
        message:
          "No approved seller account found for this email. Please apply to become a seller first.",
      });
    }

    const data = sellerSnap.data ? sellerSnap.data() : {};
    const status = String(data.status || "").toLowerCase();

    if (status !== "approved") {
      return res.status(403).json({
        ok: false,
        code: "not_approved",
        message:
          status === "pending"
            ? "Your seller application is still under review. You will be notified once approved."
            : "Your seller account is not currently approved.",
      });
    }

    // Try to find existing Firebase Auth user, or create one
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(userRecord.uid, { password });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        await adminAuth.createUser({ email, password });
      } else {
        throw err;
      }
    }

    // Mark registration in seller doc
    await sellerSnap.ref.set(
      {
        registeredAt: new Date(),
        invitationToken: null,
      },
      { merge: true }
    );

    console.log(`[SELLER-SETUP-PW] Password set for seller ${email}`);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[SELLER-SETUP-PW] error", err);
    return res.status(500).json({
      ok: false,
      code: "server",
      message: err?.message || "An unexpected error occurred.",
    });
  }
}
