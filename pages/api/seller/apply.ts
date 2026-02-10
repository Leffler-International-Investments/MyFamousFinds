// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import {
  sendAdminNewSellerApplicationEmail,
  sendSellerApplicationReceivedEmail,
} from "../../../utils/email";
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

    // ✅ Queue email to seller: application received
    if (shouldSendEmail) {
      // Try to send immediately first
      let sellerEmailSent = false;
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
        sellerEmailSent = true;
      } catch (e) {
        console.error("[APPLY] seller confirmation email failed, queuing for retry", e);
      }

      // If immediate send failed, queue for retry
      if (!sellerEmailSent) {
        const greeting = body.contactName ? `Hello ${body.contactName}` : "Hello";
        await queueEmail({
          to: email,
          subject: "MyFamousFinds — Application Received",
          text: `${greeting},\n\nThank you for applying to become a seller on MyFamousFinds!\n\nYour application is under review. You will be notified once vetted.\n\nRegards,\nThe MyFamousFinds Team`,
          eventType: "seller_application_received",
          eventKey: `${id}:seller_application_received:${today}`,
          metadata: { sellerId: id, businessName: body.businessName },
        });
      }
    } else {
      console.log(`[APPLY] seller ${email} already ${existingData?.status} — skipping confirmation email`);
    }

    // ✅ Queue email to admin: new application (if set)
    if (shouldSendEmail) {
      const adminEmail = String(process.env.ADMIN_EMAIL || "").trim();
      if (adminEmail && adminEmail.includes("@")) {
        // Try to send immediately first
        let adminEmailSent = false;
        try {
          await sendAdminNewSellerApplicationEmail(adminEmail, email);
          adminEmailSent = true;
        } catch (e) {
          console.error("[APPLY] admin notification email failed, queuing for retry", e);
        }

        // If immediate send failed, queue for retry
        if (!adminEmailSent) {
          await queueEmail({
            to: adminEmail,
            subject: "MyFamousFinds — New Seller Application",
            text: `Hello,\n\nA new seller application has been submitted.\n\nSeller email: ${email}\n\nPlease review it in the Management Dashboard.\n\nMyFamousFinds`,
            eventType: "admin_new_seller_application",
            eventKey: `${id}:admin_new_seller_application:${today}`,
            metadata: { sellerId: id, sellerEmail: email },
          });
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
