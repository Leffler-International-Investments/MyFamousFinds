// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
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

    // Check for duplicate application — only send email on first submission
    const existingDoc = await adminDb.collection("sellers").doc(id).get();
    const isNewApplication = !existingDoc.exists;

    await adminDb.collection("sellers").doc(id).set({
      ...body,
      email,
      status: "Pending",
      submittedAt: existingDoc.exists ? (existingDoc.data()?.submittedAt ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      createdAt: existingDoc.exists ? (existingDoc.data()?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ Email seller: application received (only on first submission)
    if (isNewApplication) {
      try {
        await sendSellerApplicationReceivedEmail(email, {
          businessName: body.businessName,
          contactName: body.contactName,
          phone: body.phone,
          website: body.website,
          social: body.social,
          inventory: body.inventory,
          experience: body.experience,
        });
      } catch (e) {
        console.error("[APPLY] seller confirmation email failed", e);
      }
    } else {
      console.log(`[APPLY] duplicate submission for ${email} — skipping confirmation email`);
    }

    // ✅ Email admin: new application (if set, only on first submission)
    if (isNewApplication) {
      const adminEmail = String(process.env.ADMIN_EMAIL || "").trim();
      if (adminEmail && adminEmail.includes("@")) {
        try {
          await sendAdminNewSellerApplicationEmail(adminEmail, email);
        } catch (e) {
          console.error("[APPLY] admin notification email failed", e);
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
