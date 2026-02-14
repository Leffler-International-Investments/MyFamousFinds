// FILE: /pages/api/management/test-sms.ts
// Diagnostic endpoint — sends a test SMS to verify AWS SNS config.
// Protected by ADMIN_API_SECRET.
import type { NextApiRequest, NextApiResponse } from "next";
import { isSmsConfigured, normalizePhoneE164, sendSms } from "../../../utils/sms";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "POST only" });
  }

  const secret = String(req.body?.secret || req.headers["x-admin-secret"] || "").trim();
  const adminSecret = String(process.env.ADMIN_API_SECRET || "").trim();

  if (!adminSecret || secret !== adminSecret) {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }

  const to = String(req.body?.to || "").trim();
  if (!to) {
    return res.status(400).json({ ok: false, message: "Missing 'to' phone number" });
  }

  // Step 1: Check SMS config
  if (!isSmsConfigured()) {
    return res.status(200).json({
      ok: false,
      step: "config_check",
      message: "AWS SNS is NOT configured. Missing one or more env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.",
    });
  }

  // Step 2: Normalize and log
  const normalized = normalizePhoneE164(to);

  // Step 3: Attempt send
  try {
    const result = await sendSms(normalized, "MyFamousFinds SMS test — if you received this, SMS is working!");
    return res.status(200).json({
      ok: true,
      messageId: result.sid,
      to: normalized,
      message: `Test SMS sent successfully (MessageId: ${result.sid})`,
    });
  } catch (err: any) {
    return res.status(200).json({
      ok: false,
      step: "sns_send",
      to: normalized,
      error: err?.message || "Unknown error",
      message: `SMS send failed: ${err?.message || "Unknown error"}`,
    });
  }
}
