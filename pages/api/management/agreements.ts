// FILE: /pages/api/management/agreements.ts
// Lists all consignment agreements for the management dashboard

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type Agreement = {
  id: string;
  sellerId: string;
  sellerEmail: string;
  fullName: string;
  businessName: string;
  method: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
};

type AgreementsResponse =
  | { ok: true; agreements: Agreement[]; total: number }
  | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgreementsResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, message: "Server not configured." });
  }

  try {
    // Read from seller_agreements — this is where sellers actually sign agreements
    // (consignment_agreements was never written to, causing empty data)
    const snap = await adminDb
      .collection("seller_agreements")
      .get();

    const agreements: Agreement[] = snap.docs.map((doc) => {
      const d = doc.data();
      // Map seller_agreements fields to Agreement type
      const accepted = d.accepted === true;
      let status = "pending_email";
      if (d.status === "revoked") status = "revoked";
      else if (d.status === "signed" || accepted) status = "signed";
      else if (d.status) status = d.status;

      return {
        id: doc.id,
        sellerId: d.sellerId || doc.id,
        sellerEmail: d.email || d.sellerEmail || doc.id,
        fullName: d.consignorName || d.fullName || "",
        businessName: d.businessName || "",
        method: d.method || (d.version ? "electronic" : "email"),
        status,
        signedAt: d.acceptedAt || d.signedAt || null,
        createdAt: d.acceptedAt || d.createdAt || "",
      };
    });

    return res
      .status(200)
      .json({ ok: true, agreements, total: agreements.length });
  } catch (err) {
    console.error("management_agreements_list_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unexpected server error." });
  }
}
