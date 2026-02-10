// FILE: /pages/api/seller/agreement-status.ts
// Returns whether the seller has signed the consignment agreement

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type StatusResponse =
  | { ok: true; agreementSigned: boolean; method?: string }
  | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ ok: false, message: "Email is required." });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, message: "Server not configured." });
  }

  try {
    // Check the seller doc for agreementSigned flag
    let sellerSnap: any = await adminDb
      .collection("sellers")
      .doc(email)
      .get();

    if (!sellerSnap.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerSnap = byEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", email)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    if (!sellerSnap.exists) {
      return res
        .status(404)
        .json({ ok: false, message: "Seller not found." });
    }

    const data = sellerSnap.data() || {};
    const agreementSigned = data.agreementSigned === true;
    return res
      .status(200)
      .json({ ok: true, agreementSigned, method: data.agreementMethod });
  } catch (err) {
    console.error("agreement_status_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unexpected server error." });
  }
}
