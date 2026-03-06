// FILE: pages/api/ses/inbound.ts
// Receives inbound emails via AWS SES → SNS → HTTPS webhook.
//
// Setup (AWS Console):
//   1. SES > Email receiving > Create rule set > Add receipt rule for
//      support@myfamousfinds.com with an SNS action.
//   2. Subscribe the SNS topic to this endpoint (HTTPS).
//   3. On first call SNS sends a SubscriptionConfirmation — we auto-confirm it.
//
// Once active, every email to support@myfamousfinds.com arrives here as a
// JSON payload.  We log it to Firestore (supportInbox collection) and
// optionally forward a notification to the admin email.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendMail } from "../../../utils/email";

// Only allow known SNS message types
const ALLOWED_TYPES = new Set([
  "SubscriptionConfirmation",
  "Notification",
  "UnsubscribeConfirmation",
]);

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    // SNS sends the message type as an HTTP header
    const messageType =
      (req.headers["x-amz-sns-message-type"] as string) || "";

    if (!ALLOWED_TYPES.has(messageType)) {
      console.warn("[SES-INBOUND] Unknown SNS message type:", messageType);
      return res.status(400).json({ error: "unknown_message_type" });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // ── Auto-confirm SNS subscription ─────────────────────────────
    if (messageType === "SubscriptionConfirmation") {
      const subscribeUrl = body.SubscribeURL;
      if (subscribeUrl) {
        console.log("[SES-INBOUND] Confirming SNS subscription…");
        await fetch(subscribeUrl);
        console.log("[SES-INBOUND] SNS subscription confirmed.");
      }
      return res.status(200).json({ confirmed: true });
    }

    // ── Process inbound email notification ────────────────────────
    if (messageType === "Notification") {
      const message =
        typeof body.Message === "string"
          ? JSON.parse(body.Message)
          : body.Message;

      // SES wraps the email data inside message.mail / message.content
      const mail = message?.mail || {};
      const receipt = message?.receipt || {};
      const from = mail.source || mail.from || "(unknown sender)";
      const to = (mail.destination || []).join(", ");
      const subject = mail.commonHeaders?.subject || "(no subject)";
      const date = mail.commonHeaders?.date || new Date().toISOString();
      const messageId = mail.messageId || "";

      console.log(
        `[SES-INBOUND] Email from="${from}" to="${to}" subject="${subject}"`
      );

      // Persist to Firestore
      if (adminDb) {
        try {
          await adminDb.collection("supportInbox").add({
            from,
            to,
            subject,
            date,
            messageId,
            spamVerdict: receipt.spamVerdict?.status || "unknown",
            virusVerdict: receipt.virusVerdict?.status || "unknown",
            raw: JSON.stringify(message).slice(0, 50000),
            createdAt: FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.error("[SES-INBOUND] Firestore write failed:", err);
        }
      }

      // Forward a notification to the admin
      const adminEmailRaw =
        process.env.ADMIN_EMAIL ||
        process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0]?.trim() ||
        "";
      const adminEmail = adminEmailRaw
        ? adminEmailRaw.replace(/@famousfinds\.com$/i, "@myfamousfinds.com")
        : "";

      if (adminEmail) {
        try {
          const text =
            `New inbound email received at support@myfamousfinds.com\n\n` +
            `From: ${from}\n` +
            `Subject: ${subject}\n` +
            `Date: ${date}\n` +
            `Message ID: ${messageId}\n\n` +
            `View it in the supportInbox Firestore collection.`;

          await sendMail(
            adminEmail,
            `[Inbound] ${subject}`,
            text
          );
        } catch (err) {
          console.error("[SES-INBOUND] Admin notification failed:", err);
        }
      }

      return res.status(200).json({ received: true });
    }

    // UnsubscribeConfirmation — just acknowledge
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[SES-INBOUND] Error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}
