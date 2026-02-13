// FILE: /pages/api/admin/reject-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { queueEmail } from "../../../../utils/emailOutbox";
import { requireAdmin } from "../../../../utils/adminAuth";

type Data = { ok: true; emailSent: boolean; emailQueued?: boolean } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const { id } = req.query;
    const { reason } = (req.body || {}) as { reason?: string };

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
    const email: string =
      (data.contactEmail as string) ||
      (data.email as string) ||
      "";
    const businessName: string =
      (data.businessName as string) || (data.storeName as string) || "";
    const adminRecipients = String(
      process.env.ADMIN_NOTIFICATION_EMAILS ||
      process.env.ADMIN_EMAIL ||
      "admin@myfamousfinds.com"
    )
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.includes("@"));
    const adminTo = adminRecipients.join(",");

    // Update Firestore
    await ref.set(
      {
        status: "Rejected",
        rejectedAt: new Date(),
        rejectionReason: typeof reason === "string" ? reason : null,
      },
      { merge: true }
    );

    // ✅ FULL OUTBOX PATTERN: Queue email for guaranteed delivery
    let emailQueued = false;

    const today = new Date().toISOString().slice(0, 10);

    if (email) {
      const reasonText = typeof reason === "string" && reason ? `\n\nFeedback: ${reason}` : "";
      const jobId = await queueEmail({
        to: email,
        subject: "Famous Finds — Seller Application Update",
        text: `Hello${businessName ? " " + businessName : ""},\n\nThank you for your interest in becoming a seller on Famous Finds.\n\nAfter reviewing your application, we are unable to approve it at this time.${reasonText}\n\nYou are welcome to re-apply in the future.\n\nRegards,\nThe Famous Finds Team`,
        eventType: "seller_rejected",
        eventKey: `${sellerId}:seller_rejected:${today}`,
        metadata: { sellerId, businessName, reason },
      });
      emailQueued = !!jobId;
      console.log(`[REJECT-SELLER] Email queued for ${email} (seller ${sellerId}), jobId: ${jobId}`);
    } else {
      console.warn(`[REJECT-SELLER] no email address found for seller ${sellerId} — skipping email`);
    }

    if (adminTo) {
      const internalJobId = await queueEmail({
        to: adminTo,
        subject: "Famous Finds — Seller Rejected",
        text:
          `Seller rejected in vetting queue.

` +
          `Business: ${businessName || "N/A"}
` +
          `Seller email: ${email || "N/A"}
` +
          `Seller ID: ${sellerId}
` +
          `Reason: ${typeof reason === "string" && reason ? reason : "N/A"}`,
        eventType: "seller_rejected_internal_notice",
        eventKey: `${sellerId}:seller_rejected_internal_notice:${today}`,
        metadata: { sellerId, sellerEmail: email, reason },
      });
      console.log(`[REJECT-SELLER] Internal notice queued to ${adminTo}, jobId: ${internalJobId}`);
    }

    return res.status(200).json({ ok: true, emailSent: false, emailQueued });
  } catch (err: any) {
    console.error("reject_seller_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
