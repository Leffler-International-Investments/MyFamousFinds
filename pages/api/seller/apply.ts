// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import {
  sendAdminNewSellerApplicationEmail,
  sendSellerApplicationReceivedEmail,
} from "../../../utils/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        error:
          "Firebase Admin is not configured. Missing FIREBASE_SERVICE_ACCOUNT_JSON (or split FB_* env vars).",
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "Missing email" });
    }

    const id = email.replace(/\./g, "_");

    await adminDb.collection("sellerApplications").doc(id).set({
      ...body,
      email,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ Email seller: application received
    try {
      await sendSellerApplicationReceivedEmail(email);
    } catch (e) {
      console.error("seller apply email failed", e);
    }

    // ✅ Email admin: new application (if set)
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim();
    if (adminEmail && adminEmail.includes("@")) {
      try {
        await sendAdminNewSellerApplicationEmail(adminEmail, email);
      } catch (e) {
        console.error("admin new seller email failed", e);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
