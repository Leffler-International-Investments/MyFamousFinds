// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendApplicationConfirmationEmail } from "../../../utils/email";

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
        contactName: (contactName || "").toString().trim(),
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

    // Send confirmation email to applicant
    let emailSent = false;
    try {
      await sendApplicationConfirmationEmail({
        to: trimmedEmail,
        businessName: trimmedBusiness,
      });
      emailSent = true;
    } catch (err) {
      console.error("send_application_confirmation_email_error", err);
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
