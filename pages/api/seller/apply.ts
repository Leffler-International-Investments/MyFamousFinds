// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import {
  sendAdminNewSellerApplicationEmail,
  sendSellerApplicationReceivedEmail,
} from "../../../utils/email";
import { queueEmail } from "../../../utils/emailOutbox";

type ApplyResponse = {
  ok: boolean;
  error?: string;
  warning?: string;
  emailErrors?: string[];
  queuedEmailJobs?: string[];
};

function isSmtpAuthError(message: string) {
  const m = message.toLowerCase();
  return m.includes("535") || m.includes("invalid login") || m.includes("authentication");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApplyResponse>) {
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

    const adminRecipients = String(
      process.env.ADMIN_NOTIFICATION_EMAILS ||
      process.env.ADMIN_EMAIL ||
      "ita.leff@gmail.com,leffleryd@gmail.com"
    )
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.includes("@"));
    const adminTo = adminRecipients.join(",");

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
    const queuedEmailJobs: string[] = [];
    const today = new Date().toISOString().slice(0, 10);

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
      const message = e?.message || "unknown_error";
      console.error("[APPLY] seller confirmation email failed", e);
      emailErrors.push(`seller_confirmation_failed: ${message}`);

      const sellerGreeting = body.contactName ? `Hello ${body.contactName}` : "Hello";
      const sellerText = `${sellerGreeting},\n\nThank you for applying to become a seller on MyFamousFinds!\n\nWe received your application and our team will review it shortly.\n\nRegards,\nThe MyFamousFinds Team`;
      const sellerJobId = await queueEmail({
        to: email,
        subject: "MyFamousFinds — Application Received",
        text: sellerText,
        eventType: "seller_application_received",
        eventKey: `${id}:seller_application_received:${today}`,
        metadata: { sellerId: id, fallbackFrom: "api/seller/apply" },
      });
      if (sellerJobId) queuedEmailJobs.push(sellerJobId);
    }

    if (!adminTo) {
      emailErrors.push("admin_notification_failed: no_admin_recipients_configured");
    }

    if (adminTo) {
      try {
        await sendAdminNewSellerApplicationEmail(adminTo, email);
      } catch (e: any) {
      const message = e?.message || "unknown_error";
      console.error("[APPLY] admin notification email failed", e);
      emailErrors.push(`admin_notification_failed: ${message}`);

      const adminText =
        "Hello,\n\n" +
        "A new seller application has been submitted.\n\n" +
        `Seller email: ${email}\n\n` +
        "Please review it in the Management Dashboard.\n\n" +
        "MyFamousFinds";

      const adminJobId = await queueEmail({
        to: adminTo,
        subject: "MyFamousFinds — New Seller Application",
        text: adminText,
        eventType: "admin_new_seller_application",
        eventKey: `${id}:admin_new_seller_application:${today}`,
        metadata: { sellerId: id, sellerEmail: email, fallbackFrom: "api/seller/apply" },
      });
      if (adminJobId) queuedEmailJobs.push(adminJobId);
      }
    }

    if (emailErrors.length > 0) {
      const hasAuthIssue = emailErrors.some(isSmtpAuthError);
      return res.status(200).json({
        ok: true,
        warning: hasAuthIssue
          ? "Application saved. Email login failed (SMTP auth). We queued retries; please verify SMTP_USER/SMTP_PASS App Password in Vercel."
          : "Application saved. One or more emails failed to send immediately, but retry jobs were queued.",
        emailErrors,
        queuedEmailJobs,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
