// FILE: /pages/api/admin/email-queue/process.ts
// Processes pending emails from the outbox - call via cron or manually

import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../../utils/email";
import {
  getPendingEmails,
  markEmailSent,
  markEmailFailed,
} from "../../../../utils/emailOutbox";

type Result = {
  ok: boolean;
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>
) {
  // Allow GET for easy cron triggers, POST for manual
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      processed: 0,
      sent: 0,
      failed: 0,
      errors: ["Method not allowed"],
    });
  }

  const limit = Number(req.query.limit) || 10;
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  try {
    const pendingJobs = await getPendingEmails(limit);
    console.log(`[email-queue/process] Found ${pendingJobs.length} pending emails`);

    for (const job of pendingJobs) {
      if (!job.id) continue;

      try {
        console.log(`[email-queue/process] Sending: ${job.id} to ${job.to}`);

        const info = await sendMail(job.to, job.subject, job.text, job.html);
        await markEmailSent(job.id, info?.messageId);
        sent++;

        console.log(`[email-queue/process] Success: ${job.id}`);
      } catch (err: any) {
        const errorMsg = err?.message || "Unknown error";
        console.error(`[email-queue/process] Failed: ${job.id}`, errorMsg);

        await markEmailFailed(job.id, errorMsg, job.attempts);
        failed++;
        errors.push(`${job.id}: ${errorMsg}`);
      }
    }

    return res.status(200).json({
      ok: true,
      processed: pendingJobs.length,
      sent,
      failed,
      errors,
    });
  } catch (err: any) {
    console.error("[email-queue/process] Error:", err);
    return res.status(500).json({
      ok: false,
      processed: 0,
      sent,
      failed,
      errors: [err?.message || "Internal error"],
    });
  }
}
