// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import {
  sendAdminNewSellerApplicationEmail,
  sendSellerApplicationReceivedEmail,
} from "../../../utils/email";

type ApplyResponse = {
  ok: boolean;
  error?: string;
};

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

    // Seed seller_banking with address data so downstream systems
    // (profile prefill, bulk-simple prefill, UPS label generation) can find it.
    const addrLine1 = String(body.address || "").trim();
    const addrCity = String(body.city || "").trim();
    const addrState = String(body.state || "").trim();
    const addrZip = String(body.zip || "").trim();
    const addrCountry = String(body.country || "US").trim();

    if (addrLine1 && addrCity && addrState && addrZip) {
      try {
        const bankingRef = adminDb.collection("seller_banking").doc(email);
        const bankingSnap = await bankingRef.get();
        const existingBanking = bankingSnap.exists ? bankingSnap.data() : null;

        // Only seed address if seller_banking doesn't already have one
        // (don't overwrite address that the seller explicitly set later)
        if (!existingBanking?.addressLine1) {
          await bankingRef.set(
            {
              email,
              addressLine1: addrLine1,
              city: addrCity,
              state: addrState,
              postalCode: addrZip,
              country: addrCountry,
              legalName: String(body.contactName || body.businessName || "").trim(),
              phone: String(body.phone || "").trim(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }
      } catch (bankErr) {
        console.warn("[APPLY] Could not seed seller_banking with address:", bankErr);
      }
    }

    const emailErrors: string[] = [];

    try {
      await sendSellerApplicationReceivedEmail(email, {
        businessName: body.businessName,
        contactName: body.contactName,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        country: body.country,
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
      // Log server-side but never expose SMTP errors to the applicant
      console.warn("[APPLY] email errors (suppressed from UI):", emailErrors);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("seller/apply error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
