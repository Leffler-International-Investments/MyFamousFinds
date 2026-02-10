// FILE: /pages/api/admin/reject-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { sendSellerRejectionEmail } from "../../../../utils/email";
import { queueEmail } from "../../../../utils/emailOutbox";

type Data = { ok: true; emailSent: boolean; emailQueued?: boolean } | { error: string };

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

    // Update Firestore
    await ref.set(
      {
        status: "Rejected",
        rejectedAt: new Date(),
        rejectionReason: typeof reason === "string" ? reason : null,
      },
      { merge: true }
    );

    let emailSent = false;
    let emailQueued = false;

    if (email) {
      // Try to send immediately
      try {
        await sendSellerRejectionEmail({
          to: email,
          businessName,
          reason: typeof reason === "string" ? reason : undefined,
        });
        emailSent = true;
        console.log(`[REJECT-SELLER] rejection email sent to ${email} for seller ${sellerId}`);
      } catch (err) {
        console.error(`[REJECT-SELLER] rejection email FAILED for ${email} (seller ${sellerId}), queuing for retry`, err);

        // Queue for retry with exponential backoff
        const today = new Date().toISOString().slice(0, 10);
        const reasonText = typeof reason === "string" && reason ? `\n\nFeedback: ${reason}` : "";
        const jobId = await queueEmail({
          to: email,
          subject: "MyFamousFinds — Seller Application Update",
          text: `Hello${businessName ? " " + businessName : ""},\n\nThank you for your interest in becoming a seller on MyFamousFinds.\n\nAfter reviewing your application, we are unable to approve it at this time.${reasonText}\n\nYou are welcome to re-apply at any time.\n\nRegards,\nThe MyFamousFinds Team`,
          eventType: "seller_rejected",
          eventKey: `${sellerId}:seller_rejected:${today}`,
          metadata: { sellerId, businessName, reason },
        });
        emailQueued = !!jobId;
      }
    } else {
      console.warn(`[REJECT-SELLER] no email address found for seller ${sellerId} — skipping email`);
    }

    return res.status(200).json({ ok: true, emailSent, emailQueued });
  } catch (err: any) {
    console.error("reject_seller_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
