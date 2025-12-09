// FILE: /pages/api/seller/banking.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Ok = { ok: true; prefs?: any };
type Err = { ok: false; error: string };
type Data = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // email comes from the logged-in seller (stored as ff-email in localStorage)
    const emailFromQuery = typeof req.query.email === "string"
      ? req.query.email
      : undefined;

    const emailFromBody =
      typeof req.body?.email === "string" ? req.body.email : undefined;

    const rawEmail = emailFromQuery || emailFromBody;

    if (!rawEmail) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing seller email parameter" });
    }

    const email = rawEmail.toLowerCase().trim();
    const docRef = adminDb.collection("seller_banking").doc(email);

    // ─────────────────────────────────────────
    // GET  → load existing banking preferences
    // ─────────────────────────────────────────
    if (req.method === "GET") {
      const snap = await docRef.get();
      if (!snap.exists) {
        // No prefs saved yet, return ok with empty prefs
        return res.status(200).json({ ok: true, prefs: null });
      }

      return res.status(200).json({ ok: true, prefs: snap.data() || {} });
    }

    // ─────────────────────────────────────────
    // POST → save / update banking preferences
    // ─────────────────────────────────────────
    if (req.method === "POST") {
      const {
        legalName,
        sellingAs,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        pausePayouts,
        payoutSchedule,
        notes,
        confirmAccuracy,
        consentElectronic,
      } = req.body || {};

      if (!confirmAccuracy || !consentElectronic) {
        return res.status(400).json({
          ok: false,
          error:
            "Please confirm your details are accurate and consent to electronic payouts.",
        });
      }

      await docRef.set(
        {
          email,
          legalName: legalName || "",
          sellingAs: sellingAs || "individual",
          addressLine1: addressLine1 || "",
          addressLine2: addressLine2 || "",
          city: city || "",
          state: state || "",
          postalCode: postalCode || "",
          country: country || "United States",
          phone: phone || "",
          pausePayouts: !!pausePayouts,
          payoutSchedule: payoutSchedule || "Weekly",
          notes: notes || "",
          confirmAccuracy: !!confirmAccuracy,
          consentElectronic: !!consentElectronic,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true });
    }

    // Any other HTTP method
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed on this endpoint" });
  } catch (err: any) {
    console.error("seller_banking_error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal server error",
    });
  }
}
