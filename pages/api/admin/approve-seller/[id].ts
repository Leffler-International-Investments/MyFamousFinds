// FILE: /pages/api/admin/approve-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { queueEmail } from "../../../../utils/emailOutbox";
import { requireAdmin } from "../../../../utils/adminAuth";
import crypto from "crypto";

type Data =
  | { ok: true; registerUrl: string; emailSent: boolean; emailQueued?: boolean }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;
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

    const adminRecipients = String(
      process.env.ADMIN_NOTIFICATION_EMAILS ||
      process.env.ADMIN_EMAIL ||
      "leffleryd@gmail.com"
    )
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.includes("@"));
    const adminTo = adminRecipients.join(",");

    const token = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host ?? ""}`;
    const registerUrl = `${baseUrl}/seller/register?id=${encodeURIComponent(sellerId)}&token=${token}`;
    const loginUrl = `${baseUrl}/seller/login`;

    await ref.set(
      {
        status: "Approved",
        approvedAt: new Date(),
        invitationToken: token,
        invitationUrl: registerUrl,
      },
      { merge: true }
    );

    // ✅ FULL OUTBOX PATTERN: Queue email for guaranteed delivery
    const today = new Date().toISOString().slice(0, 10);
    const jobId = await queueEmail({
      to: email,
      subject: "Famous Finds — Your Seller Account Has Been Approved!",
      text: `Hello${businessName ? " " + businessName : ""},\n\nGreat news — your seller account on Famous Finds has been approved!\n\nLogin here - ${loginUrl} and complete the registration process.\n\nWelcome aboard!\nThe Famous Finds Team`,
      html: `<p>Hello${businessName ? " " + businessName : ""},</p><p><b>Great news — your seller account has been approved!</b></p><p>Login here - <a href="${loginUrl}">${loginUrl}</a> and complete the registration process.</p><p>Welcome aboard!<br/>The Famous Finds Team</p>`,
      eventType: "seller_approved",
      eventKey: `${sellerId}:seller_approved:${today}`,
      metadata: { sellerId, businessName, loginUrl, registerUrl },
    });

    const emailQueued = !!jobId;
    console.log(`[APPROVE-SELLER] Email queued for ${email} (seller ${sellerId}), jobId: ${jobId}`);

    if (adminTo) {
      const internalJobId = await queueEmail({
        to: adminTo,
        subject: "Famous Finds — Seller Approved",
        text:
          `Seller approved in vetting queue.

` +
          `Business: ${businessName || "N/A"}
` +
          `Seller email: ${email}
` +
          `Seller ID: ${sellerId}
` +
          `Invite URL: ${registerUrl}`,
        eventType: "seller_approved_internal_notice",
        eventKey: `${sellerId}:seller_approved_internal_notice:${today}`,
        metadata: { sellerId, sellerEmail: email, registerUrl },
      });
      console.log(`[APPROVE-SELLER] Internal notice queued to ${adminTo}, jobId: ${internalJobId}`);
    }

    return res.status(200).json({ ok: true, registerUrl, emailSent: false, emailQueued });
  } catch (err: any) {
    console.error("approve_seller_error", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
