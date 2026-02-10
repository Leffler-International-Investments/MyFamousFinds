// FILE: /pages/api/seller/agreement.ts
// GET: Check if seller has accepted the consignment agreement
// POST: Save the seller's acceptance of the consignment agreement

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Resp =
  | { ok: true; accepted: boolean; acceptedAt?: string; consignorName?: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  const email =
    String(req.body?.email || req.query?.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required." });
  }

  // GET - check status
  if (req.method === "GET") {
    try {
      const ref = adminDb.collection("seller_agreements").doc(email);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(200).json({ ok: true, accepted: false });
      }
      const data = snap.data() || {};
      return res.status(200).json({
        ok: true,
        accepted: !!data.accepted,
        acceptedAt: data.acceptedAt || undefined,
        consignorName: data.consignorName || undefined,
      });
    } catch (err: any) {
      console.error("[AGREEMENT] GET error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  // POST - save acceptance
  if (req.method === "POST") {
    const { consignorName, consignorDate } = req.body || {};

    if (!consignorName) {
      return res.status(400).json({ ok: false, error: "Your name is required." });
    }

    try {
      await adminDb
        .collection("seller_agreements")
        .doc(email)
        .set({
          email,
          accepted: true,
          consignorName: String(consignorName).trim(),
          consignorDate: consignorDate || new Date().toISOString().split("T")[0],
          acceptedAt: new Date().toISOString(),
        });

      // Also mark in the seller doc
      const sellerRef = adminDb.collection("sellers").doc(email);
      const sellerSnap = await sellerRef.get();
      if (sellerSnap.exists) {
        await sellerRef.set(
          { agreementAccepted: true, agreementAcceptedAt: new Date().toISOString() },
          { merge: true }
        );
      }

      console.log(`[AGREEMENT] accepted by ${email}`);
      return res.status(200).json({ ok: true, accepted: true });
    } catch (err: any) {
      console.error("[AGREEMENT] POST error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
