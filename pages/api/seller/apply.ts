// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { queueEmail } from "../../../utils/emailOutbox";

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
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for idempotency

    // Check for duplicate application — send email on first submission
    // or if the seller is still Pending (email may have failed previously)
    const existingDoc = await adminDb.collection("sellers").doc(id).get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;
    const shouldSendEmail =
      !existingDoc.exists || existingData?.status === "Pending";

    await adminDb.collection("sellers").doc(id).set({
      ...body,
      email,
      status: "Pending",
      submittedAt: existingDoc.exists ? (existingData?.submittedAt ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      createdAt: existingDoc.exists ? (existingData?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ FULL OUTBOX PATTERN: Queue ALL emails upfront for guaranteed delivery
    if (shouldSendEmail) {
      const greeting = body.contactName ? `Hello ${body.contactName}` : "Hello";

      // 1. Queue email to seller: application received
      await queueEmail({
        to: email,
        subject: "Famous Finds — Application Received",
        text: `${greeting},\n\nThank you for applying to become a seller on Famous Finds!\n\nWe've received your application and our team will review it shortly. This process typically takes 1-2 business days.\n\nOnce reviewed, you'll receive an email with the outcome.\n\nIf you have any questions, feel free to reply to this email.\n\nThanks for your interest in Famous Finds!`,
        eventType: "seller_application_received",
        eventKey: `${id}:seller_application_received:${today}`,
        metadata: { sellerId: id, businessName: body.businessName },
      });

      // 2. Queue email to admin: new application (if ADMIN_EMAIL is set)
      const adminEmail = String(process.env.ADMIN_EMAIL || "").trim();
      if (adminEmail && adminEmail.includes("@")) {
        await queueEmail({
          to: adminEmail,
          subject: "Famous Finds — New Seller Application",
          text: `Hello,\n\nA new seller application has been submitted.\n\nBusiness: ${body.businessName || "Not provided"}\nEmail: ${email}\nContact: ${body.contactName || "Not provided"}\n\nPlease review it in the Management Dashboard:\nhttps://myfamousfinds.com/management/vetting-queue\n\nFamous Finds`,
          eventType: "admin_new_seller_application",
          eventKey: `${id}:admin_new_seller_application:${today}`,
          metadata: { sellerId: id, sellerEmail: email, businessName: body.businessName },
        });
      }

      console.log(`[APPLY] Queued 2 emails for seller ${email}`);
    } else {
      console.log(`[APPLY] seller ${email} already ${existingData?.status} — skipping emails`);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
