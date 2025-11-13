// FILE: /pages/api/seller/apply.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, admin } from "../../../utils/firebaseAdmin";

type Ok = { ok: true };
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
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("api/seller/apply error", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to submit application. Try again." });
  }
}
