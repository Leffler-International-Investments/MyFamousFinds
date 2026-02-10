// FILE: /pages/api/admin/log-manual-notification.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Data = { ok: true } | { error: string };

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
    const { sellerId, sellerEmail, decision, sentBy, notes } = req.body || {};

    if (!sellerId || typeof sellerId !== "string") {
      return res.status(400).json({ error: "Missing sellerId" });
    }
    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ error: "Invalid decision" });
    }

    // Log to manual_notifications collection
    await adminDb.collection("manual_notifications").add({
      sellerId,
      sellerEmail: sellerEmail || "",
      decision,
      sentBy: sentBy || "staff",
      notes: notes || "",
      timestamp: new Date(),
    });

    // Also update the seller doc with manual notification record
    const sellerRef = adminDb.collection("sellers").doc(sellerId);
    await sellerRef.set(
      {
        manualNotificationSent: true,
        manualNotificationAt: new Date(),
        manualNotificationBy: sentBy || "staff",
      },
      { merge: true }
    );

    console.log(
      `[MANUAL-NOTIFICATION] Logged for seller ${sellerId} (${sellerEmail}), decision: ${decision}`
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("log_manual_notification_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
