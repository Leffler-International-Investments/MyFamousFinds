// FILE: /pages/api/admin/approve-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { sendSellerInviteEmail } from "../../../../utils/email";
import crypto from "crypto";

type Data =
  | { ok: true; registerUrl: string; emailSent: boolean }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Missing seller id" });
    }

    const sellerId = id as string;
    const ref = adminDb.collection("sellers").doc(sellerId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Seller application not found" });
    }

    const data = snap.data() || {};
    const email: string = (data.contactEmail as string) || (data.email as string) || "";

    if (!email) {
      return res
        .status(400)
        .json({ error: "Seller record has no contact email address." });
    }

    const businessName: string =
      (data.businessName as string) || (data.storeName as string) || "";

    // Generate a secure invitation token
    const token = crypto.randomBytes(32).toString("hex");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host ?? ""}`;
    const registerUrl = `${baseUrl}/seller/register?id=${encodeURIComponent(
      sellerId
    )}&token=${token}`;

    // Update Firestore
    await ref.set(
      {
        status: "Approved",
        approvedAt: new Date(),
        invitationToken: token,
        invitationUrl: registerUrl,
      },
      { merge: true }
    );

    // ✅ Email #2: "You have been approved"
    let emailSent = false;
    try {
      await sendSellerInviteEmail({
        to: email,
        businessName,
        registerUrl,
      });
      emailSent = true;
    } catch (err) {
      console.error("send_seller_invite_email_error", err);
      emailSent = false;
    }

    return res.status(200).json({ ok: true, registerUrl, emailSent });
  } catch (err: any) {
    console.error("approve_seller_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
