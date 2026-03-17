// FILE: /pages/api/seller/banking.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getAuthUser } from "../../../utils/authServer";

type Ok = { ok: true; prefs?: any };
type Err = { ok: false; error: string };
type Data = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  // Verify Firebase ID token
  const authUser = await getAuthUser(req);
  if (!authUser?.email) {
    return res.status(401).json({ ok: false, error: "Unauthorized — valid Bearer token required" });
  }

  try {
    // Use the verified email from the token, not from query/body
    const email = authUser.email.toLowerCase().trim();
    const docRef = adminDb.collection("seller_banking").doc(email);

    // ─────────────────────────────────────────
    // GET  → load existing banking preferences
    // ─────────────────────────────────────────
    if (req.method === "GET") {
      const snap = await docRef.get();
      const bankingData = snap.exists ? snap.data() || {} : null;

      // If seller_banking has address data, return it directly
      if (bankingData?.addressLine1) {
        return res.status(200).json({ ok: true, prefs: bankingData });
      }

      // Fallback: try to build address from the sellers collection
      // (become-a-seller application stores address as flat fields:
      //  address, city, state, zip, country)
      const underscoreId = email.replace(/\./g, "_");
      let sellerSnap: any = await adminDb.collection("sellers").doc(email).get();
      if (!sellerSnap.exists && underscoreId !== email) {
        sellerSnap = await adminDb.collection("sellers").doc(underscoreId).get();
      }
      if (!sellerSnap.exists) {
        const byEmail = await adminDb
          .collection("sellers")
          .where("email", "==", email)
          .limit(1)
          .get();
        if (!byEmail.empty) sellerSnap = byEmail.docs[0];
      }

      if (sellerSnap.exists) {
        const sd: any = sellerSnap.data() || {};
        const appAddress = String(sd.address || "").trim();
        const appCity = String(sd.city || "").trim();
        const appState = String(sd.state || "").trim();
        const appZip = String(sd.zip || "").trim();
        const appCountry = String(sd.country || "US").trim();

        if (appAddress && appCity && appState && appZip) {
          const fallbackPrefs = {
            ...(bankingData || {}),
            email,
            addressLine1: appAddress,
            city: appCity,
            state: appState,
            postalCode: appZip,
            country: appCountry,
            legalName: (bankingData as any)?.legalName || sd.contactName || sd.businessName || "",
            phone: (bankingData as any)?.phone || sd.phone || "",
          };
          return res.status(200).json({ ok: true, prefs: fallbackPrefs });
        }
      }

      // No address found anywhere
      return res.status(200).json({ ok: true, prefs: bankingData });
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
        // Bank account details (required for manual payouts by MFF)
        bankName,
        bankRoutingNumber,
        bankAccountNumber,
        bankAccountType,
        // PayPal email (optional — only needed if auto-payout is enabled)
        paypalEmail,
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

      const normalizedPaypalEmail =
        typeof paypalEmail === "string" && paypalEmail.trim()
          ? paypalEmail.trim().toLowerCase()
          : "";

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
          // Bank account details
          bankName: bankName || "",
          bankRoutingNumber: bankRoutingNumber || "",
          bankAccountNumber: bankAccountNumber || "",
          bankAccountType: bankAccountType || "checking",
          // PayPal email (optional for auto payouts)
          paypalEmail: normalizedPaypalEmail,
          pausePayouts: !!pausePayouts,
          payoutSchedule: payoutSchedule || "Weekly",
          notes: notes || "",
          confirmAccuracy: !!confirmAccuracy,
          consentElectronic: !!consentElectronic,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Sync PayPal email to the sellers collection (used by the auto-payout API)
      if (normalizedPaypalEmail) {
        try {
          const sellerRef = adminDb.collection("sellers").doc(email);
          await sellerRef.set(
            { paypalEmail: normalizedPaypalEmail },
            { merge: true }
          );
        } catch (syncErr) {
          console.warn("seller_banking_paypal_sync_warning", syncErr);
        }
      }

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
