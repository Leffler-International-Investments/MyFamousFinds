// FILE: /pages/api/management/agreements.ts
// Lists all consignment agreements for the management dashboard

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

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

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, message: "Server not configured." });
  }

  try {
    const snap = await adminDb
      .collection("consignment_agreements")
      .orderBy("createdAt", "desc")
      .get();

    const agreements: Agreement[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        sellerId: d.sellerId || "",
        sellerEmail: d.sellerEmail || "",
        fullName: d.fullName || "",
        businessName: d.businessName || "",
        method: d.method || "",
        status: d.status || "",
        signedAt: d.signedAt || null,
        createdAt: d.createdAt || "",
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
