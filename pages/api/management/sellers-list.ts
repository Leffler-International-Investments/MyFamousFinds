// FILE: /pages/api/management/sellers-list.ts
// GET — returns all sellers as a lightweight list for the training page.
// Requires valid admin session.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type SellerItem = { id: string; name: string; email: string; status: string };
type Result = { sellers: SellerItem[] } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Result>) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;
  if (!isFirebaseAdminReady || !adminDb) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const snap = await adminDb.collection("sellers").get();
    const sellers: SellerItem[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.name || d.businessName || d.contactName || "Seller",
        email: d.email || d.contactEmail || "",
        status: d.status || "Active",
      };
    });
    return res.status(200).json({ sellers });
  } catch (err: any) {
    console.error("[sellers-list]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
