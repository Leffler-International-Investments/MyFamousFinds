// FILE: /pages/api/management/agreement-action.ts
// Admin action to confirm receipt of emailed agreements or revoke agreements

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";

type ActionResponse = { ok: true } | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ActionResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  if (!requireAdmin(req, res)) return;

  const { agreementId, action } = req.body as {
    agreementId?: string;
    action?: "confirm" | "revoke";
  };

  if (!agreementId || !action) {
    return res
      .status(400)
      .json({ ok: false, message: "agreementId and action are required." });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res
      .status(500)
      .json({ ok: false, message: "Server not configured." });
  }

  try {
    // Use seller_agreements — this is where sellers actually sign agreements
    const agreementRef = adminDb
      .collection("seller_agreements")
      .doc(agreementId);
    const agreementSnap = await agreementRef.get();

    if (!agreementSnap.exists) {
      return res
        .status(404)
        .json({ ok: false, message: "Agreement not found." });
    }

    const data = agreementSnap.data() || {};
    const sellerEmail = data.sellerEmail || "";
    const now = new Date().toISOString();

    if (action === "confirm") {
      // Mark agreement as signed/confirmed
      await agreementRef.update({
        status: "signed",
        signedAt: data.signedAt || now,
        confirmedAt: now,
        updatedAt: now,
      });

      // Update the seller doc to grant access
      const sellerId = data.sellerId || sellerEmail;
      let sellerRef: any = null;

      const sellerSnap = await adminDb
        .collection("sellers")
        .doc(sellerId)
        .get();
      if (sellerSnap.exists) {
        sellerRef = sellerSnap.ref;
      } else if (sellerEmail) {
        const byEmail = await adminDb
          .collection("sellers")
          .where("email", "==", sellerEmail)
          .limit(1)
          .get();
        if (!byEmail.empty) sellerRef = byEmail.docs[0].ref;
      }

      if (sellerRef) {
        await sellerRef.set(
          {
            agreementSigned: true,
            agreementMethod: data.method || "email",
            agreementSignedAt: now,
            agreementPendingEmail: false,
          },
          { merge: true }
        );
      }

      // Notify seller that their agreement has been confirmed
      if (sellerEmail) {
        try {
          await sendMail(
            sellerEmail,
            "MyFamousFinds — Consignment Agreement Confirmed",
            `Hello,\n\nYour Luxury Consignment Agreement has been confirmed by the MyFamousFinds team.\n\nYou now have full access to your seller dashboard. Log in at any time to start listing your items.\n\nWelcome aboard!\nThe MyFamousFinds Team`
          );
        } catch (emailErr) {
          console.error("agreement_confirm_email_error", emailErr);
        }
      }
    } else if (action === "revoke") {
      // Revoke/remove agreement
      await agreementRef.update({
        status: "revoked",
        updatedAt: now,
      });

      // Update seller doc
      const sellerId = data.sellerId || sellerEmail;
      let sellerRef: any = null;

      const sellerSnap = await adminDb
        .collection("sellers")
        .doc(sellerId)
        .get();
      if (sellerSnap.exists) {
        sellerRef = sellerSnap.ref;
      } else if (sellerEmail) {
        const byEmail = await adminDb
          .collection("sellers")
          .where("email", "==", sellerEmail)
          .limit(1)
          .get();
        if (!byEmail.empty) sellerRef = byEmail.docs[0].ref;
      }

      if (sellerRef) {
        await sellerRef.set(
          {
            agreementSigned: false,
            agreementPendingEmail: false,
          },
          { merge: true }
        );
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("agreement_action_error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Unexpected server error." });
  }
}
