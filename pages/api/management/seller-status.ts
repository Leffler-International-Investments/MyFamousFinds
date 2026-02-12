// FILE: /pages/api/management/seller-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import {
  sendSellerInviteEmail,
  sendSellerRejectionEmail,
} from "../../../utils/email";
import { requireAdmin } from "../../../utils/adminAuth";
import crypto from "crypto";

type Response =
  | { ok: true; emailSent?: boolean }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const { id, decision, reason } = req.body as {
      id?: string;
      decision?: "approved" | "rejected";
      reason?: string;
    };

    if (!id || !decision) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_parameters" });
    }

    const ref = adminDb.collection("sellers").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "seller_not_found" });
    }

    const data = snap.data() || {};
    const email: string =
      (data.contactEmail as string) || (data.email as string) || "";
    const businessName: string =
      (data.businessName as string) || (data.storeName as string) || "";

    if (decision === "approved") {
      // Generate invitation token and URL (same as approve-seller endpoint)
      const token = crypto.randomBytes(32).toString("hex");
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host ?? ""}`;
      const registerUrl = `${baseUrl}/seller/register?id=${encodeURIComponent(id)}&token=${token}`;

      await ref.set(
        {
          status: decision,
          approvedAt: new Date(),
          invitationToken: token,
          invitationUrl: registerUrl,
        },
        { merge: true }
      );

      let emailSent = false;
      if (email) {
        try {
          await sendSellerInviteEmail({ to: email, businessName, registerUrl });
          emailSent = true;
          console.log(`[SELLER-STATUS] approval email sent to ${email}`);
        } catch (err) {
          console.error(`[SELLER-STATUS] approval email failed for ${email}`, err);
        }
      }

      return res.status(200).json({ ok: true, emailSent });
    } else {
      // Rejected
      await ref.set(
        {
          status: decision,
          rejectedAt: new Date(),
          rejectionReason: typeof reason === "string" ? reason : null,
        },
        { merge: true }
      );

      let emailSent = false;
      if (email) {
        try {
          await sendSellerRejectionEmail({
            to: email,
            businessName,
            reason: typeof reason === "string" ? reason : undefined,
          });
          emailSent = true;
          console.log(`[SELLER-STATUS] rejection email sent to ${email}`);
        } catch (err) {
          console.error(`[SELLER-STATUS] rejection email failed for ${email}`, err);
        }
      }

      return res.status(200).json({ ok: true, emailSent });
    }
  } catch (err: any) {
    console.error("[SELLER-STATUS] update error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
