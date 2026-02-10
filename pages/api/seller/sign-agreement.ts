// FILE: /pages/api/seller/sign-agreement.ts
// Handles electronic signing of the consignment agreement

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";

type SignResponse =
  | { ok: true }
  | { ok: false; message: string };

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@myfamousfinds.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const {
    email,
    fullName,
    businessName,
    address,
    phone,
    method, // "electronic" or "email"
  } = req.body as {
    email?: string;
    fullName?: string;
    businessName?: string;
    address?: string;
    phone?: string;
    method?: string;
  };

  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedEmail) {
    return res.status(400).json({ ok: false, message: "Email is required." });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, message: "Server not configured." });
  }

  try {
    // Find the seller doc
    let sellerRef: any = null;
    let sellerSnap: any = await adminDb
      .collection("sellers")
      .doc(trimmedEmail)
      .get();

    if (sellerSnap.exists) {
      sellerRef = sellerSnap.ref;
    } else {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byEmail.empty) {
        sellerSnap = byEmail.docs[0];
        sellerRef = sellerSnap.ref;
      }
    }

    if (!sellerRef) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", trimmedEmail)
        .limit(1)
        .get();
      if (!byContactEmail.empty) {
        sellerSnap = byContactEmail.docs[0];
        sellerRef = sellerSnap.ref;
      }
    }

    if (!sellerRef) {
      return res
        .status(404)
        .json({ ok: false, message: "Seller not found." });
    }

    const sellerId = sellerSnap.id;
    const isElectronic = method === "electronic";
    const now = new Date().toISOString();

    // Save agreement to consignment_agreements collection
    await adminDb.collection("consignment_agreements").add({
      sellerId,
      sellerEmail: trimmedEmail,
      fullName: fullName || "",
      businessName: businessName || "",
      address: address || "",
      phone: phone || "",
      method: isElectronic ? "electronic" : "email",
      status: isElectronic ? "signed" : "pending_email",
      signedAt: isElectronic ? now : null,
      createdAt: now,
      updatedAt: now,
    });

    // Update the seller doc
    if (isElectronic) {
      await sellerRef.set(
        {
          agreementSigned: true,
          agreementMethod: "electronic",
          agreementSignedAt: now,
        },
        { merge: true }
      );
    } else {
      // Email method — seller will download and email the form
      // Admin needs to confirm receipt in management dashboard
      await sellerRef.set(
        {
          agreementSigned: false,
          agreementMethod: "email",
          agreementPendingEmail: true,
        },
        { merge: true }
      );
    }

    // Notify admin about the agreement
    try {
      const subject = isElectronic
        ? `Consignment Agreement Signed (Electronic) — ${trimmedEmail}`
        : `Consignment Agreement — Awaiting Email from ${trimmedEmail}`;

      const text = isElectronic
        ? `Seller ${fullName || trimmedEmail} has electronically signed the Luxury Consignment Agreement.\n\nSeller: ${trimmedEmail}\nBusiness: ${businessName || "N/A"}\nDate: ${now}\n\nThe agreement has been recorded in the Management Dashboard.\n\nMyFamousFinds`
        : `Seller ${fullName || trimmedEmail} has downloaded the Luxury Consignment Agreement and will email the signed copy to admin@myfamousfinds.com.\n\nSeller: ${trimmedEmail}\nBusiness: ${businessName || "N/A"}\n\nPlease confirm receipt in the Management Dashboard once you receive the signed agreement.\n\nMyFamousFinds`;

      await sendMail(ADMIN_EMAIL, subject, text);
    } catch (emailErr) {
      console.error("agreement_admin_notify_error", emailErr);
      // Don't fail the request if email fails
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("sign_agreement_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unexpected server error." });
  }
}
