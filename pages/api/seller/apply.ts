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

    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!adminEmail || !adminEmail.includes("@")) {
      return res.status(500).json({
        ok: false,
        error: "ADMIN_EMAIL is not configured. Seller application emails cannot be completed.",
      });
    }

    const id = email.replace(/\./g, "_");

    const existingDoc = await adminDb.collection("sellers").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;

    await adminDb.collection("sellers").doc(id).set({
      ...body,
      email,
      status: "Pending",
      submittedAt: existingDoc.exists
        ? existingData?.submittedAt ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      createdAt: existingDoc.exists ? existingData?.createdAt ?? Date.now() : Date.now(),
      updatedAt: Date.now(),
    });

    const emailErrors: string[] = [];

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
    } catch (e: any) {
      console.error("[APPLY] seller confirmation email failed", e);
      emailErrors.push(`seller_confirmation_failed: ${e?.message || "unknown_error"}`);
    }

    try {
      await sendAdminNewSellerApplicationEmail(adminEmail, email);
    } catch (e: any) {
      console.error("[APPLY] admin notification email failed", e);
      emailErrors.push(`admin_notification_failed: ${e?.message || "unknown_error"}`);
    }

    if (emailErrors.length > 0) {
      return res.status(502).json({
        ok: false,
        error:
          "Application was saved, but one or more emails failed to send. Please verify SMTP settings and retry.",
        emailErrors,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
