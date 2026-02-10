// FILE: /pages/api/admin/approve-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { sendSellerInviteEmail } from "../../../../utils/email";
import { queueEmail } from "../../../../utils/emailOutbox";
import crypto from "crypto";

type Data =
  | { ok: true; registerUrl: string; emailSent: boolean; emailQueued?: boolean }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!adminDb) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ error: "Missing seller id" });

    const sellerId = id as string;
    const ref = adminDb.collection("sellers").doc(sellerId);
    const snap = await ref.get();

    if (!snap.exists) return res.status(404).json({ error: "Seller application not found" });

    const data = snap.data() || {};
    const email: string = (data.contactEmail as string) || (data.email as string) || "";
    if (!email) return res.status(400).json({ error: "Seller record has no contact email address." });

    const businessName: string = (data.businessName as string) || (data.storeName as string) || "";

    const token = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host ?? ""}`;
    const registerUrl = `${baseUrl}/seller/register?id=${encodeURIComponent(sellerId)}&token=${token}`;

    await ref.set(
      {
        status: "Approved",
        approvedAt: new Date(),
        invitationToken: token,
        invitationUrl: registerUrl,
      },
      { merge: true }
    );

    let emailSent = false;
    let emailQueued = false;

    // Try to send immediately
    try {
      await sendSellerInviteEmail({ to: email, businessName, registerUrl });
      emailSent = true;
      console.log(`[APPROVE-SELLER] approval email sent to ${email} for seller ${sellerId}`);
    } catch (err) {
      console.error(`[APPROVE-SELLER] approval email FAILED for ${email} (seller ${sellerId}), queuing for retry`, err);

      // Queue for retry with exponential backoff
      const today = new Date().toISOString().slice(0, 10);
      const jobId = await queueEmail({
        to: email,
        subject: "MyFamousFinds — Your Seller Account Has Been Approved!",
        text: `Hello${businessName ? " " + businessName : ""},\n\nGreat news — your seller account on MyFamousFinds has been approved!\n\nComplete your registration here: ${registerUrl}\n\nWelcome aboard!\nThe MyFamousFinds Team`,
        html: `<p>Hello${businessName ? " " + businessName : ""},</p><p><b>Great news — your seller account has been approved!</b></p><p>Complete your registration: <a href="${registerUrl}">${registerUrl}</a></p><p>Welcome aboard!<br/>The MyFamousFinds Team</p>`,
        eventType: "seller_approved",
        eventKey: `${sellerId}:seller_approved:${today}`,
        metadata: { sellerId, businessName, registerUrl },
      });
      emailQueued = !!jobId;
    }

    return res.status(200).json({ ok: true, registerUrl, emailSent, emailQueued });
  } catch (err: any) {
    console.error("approve_seller_error", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
