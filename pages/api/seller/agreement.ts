// FILE: /pages/api/seller/agreement.ts
// GET: Check if seller has accepted the consignment agreement
// POST: Save the seller's acceptance of the consignment agreement
// Updated: includes pricing clauses with 24hr response window and proof of purchase requirements

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Resp =
  | { ok: true; accepted: boolean; acceptedAt?: string; consignorName?: string; version?: string }
  | { ok: false; error: string; message?: string };

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
        version: data.version || "1.0",
      });
    } catch (err: any) {
      console.error("[AGREEMENT] GET error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  // POST - save acceptance
  if (req.method === "POST") {
    const {
      consignorName,
      consignorAddress,
      consignorPhone,
      consignorDate,
      acceptPricingClause,
      acceptProofRequirement,
    } = req.body || {};

    if (!consignorName) {
      return res.status(400).json({ ok: false, error: "Your name is required." });
    }

    if (!acceptPricingClause) {
      return res.status(400).json({
        ok: false,
        error: "pricing_clause_required",
        message:
          "You must accept the pricing adjustment clause to continue. " +
          "Famous Finds may suggest pricing adjustments based on market conditions. " +
          "You will have a 24-hour window to respond to any suggested changes.",
      });
    }

    try {
      await adminDb
        .collection("seller_agreements")
        .doc(email)
        .set({
          email,
          accepted: true,
          consignorName: String(consignorName).trim(),
          consignorAddress: String(consignorAddress || "").trim(),
          consignorPhone: String(consignorPhone || "").trim(),
          consignorDate: consignorDate || new Date().toISOString().split("T")[0],
          acceptedAt: new Date().toISOString(),
          version: "2.0",
          // Pricing clause
          pricingClause: {
            accepted: true,
            acceptedAt: new Date().toISOString(),
            terms:
              "Famous Finds reserves the right to suggest pricing adjustments based on market conditions. " +
              "Seller will be notified via email and has a 24-hour window to respond. " +
              "If no response is received within 24 hours, the suggested price may be applied. " +
              "No seller incentives for mispricing.",
            responseWindowHours: 24,
          },
          // Proof of purchase clause
          proofOfPurchaseClause: {
            accepted: acceptProofRequirement !== false,
            terms:
              "Items priced over $499 require proof of purchase documentation. " +
              "Acceptable documents include receipts, certificates of authenticity, " +
              "or store purchase history. Documentation must be uploaded during listing creation.",
            threshold: 499,
          },
        });

      // Also mark in the seller doc
      const sellerRef = adminDb.collection("sellers").doc(email);
      const sellerSnap = await sellerRef.get();
      if (sellerSnap.exists) {
        await sellerRef.set(
          {
            agreementAccepted: true,
            agreementAcceptedAt: new Date().toISOString(),
            agreementVersion: "2.0",
          },
          { merge: true }
        );
      }

      console.log(`[AGREEMENT] accepted by ${email} (v2.0 with pricing clause)`);
      return res.status(200).json({ ok: true, accepted: true, version: "2.0" });
    } catch (err: any) {
      console.error("[AGREEMENT] POST error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
