// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendSellerApplicationReceivedEmail } from "../../../utils/email";

type Ok = { ok: true; emailSent: boolean };
type Err = { ok: false; error: string };
type Res = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const {
      businessName,
      contactName,
      email,
      phone,
      website,
      social,
      inventory,
      experience,
      notes,
    } = req.body || {};

    const trimmedEmail = (email || "").toString().trim().toLowerCase();
    const trimmedBusiness = (businessName || "").toString().trim();
    const trimmedContactName = (contactName || "").toString().trim();

    if (!trimmedBusiness || !trimmedEmail) {
      res
        .status(400)
        .json({ ok: false, error: "Business name and email are required." });
      return;
    }

    const docRef = adminDb.collection("sellers").doc(trimmedEmail);

    await docRef.set(
      {
        businessName: trimmedBusiness,
        contactName: trimmedContactName,
        contactEmail: trimmedEmail,
        email: trimmedEmail,
        phone: (phone || "").toString().trim(),
        website: (website || "").toString().trim(),
        social: (social || "").toString().trim(),
        inventory: (inventory || "").toString().trim(),
        experience: (experience || "").toString().trim(),
        notes: (notes || "").toString().trim(),
        status: "Pending",
        source: "public_vetting_form",
        submittedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ✅ Email #1: "We received your registration"
    let emailSent = false;
    try {
      await sendSellerApplicationReceivedEmail({
        to: trimmedEmail,
        businessName: trimmedBusiness,
        contactName: trimmedContactName,
      });
      emailSent = true;
    } catch (e) {
      console.error("send_seller_application_received_email_error", e);
      emailSent = false;
    }

    res.status(200).json({ ok: true, emailSent });
  } catch (err) {
    console.error("api/seller/apply error", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to submit application. Try again." });
  }
}
