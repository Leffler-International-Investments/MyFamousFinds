// FILE: /pages/api/admin/process-email-outbox.ts
// Processes pending emails in the outbox queue with retry support.
// Call via cron (e.g. Vercel Cron) or manually from the admin dashboard.

import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../../utils/email";
import {
  getPendingEmails,
  markEmailSent,
  markEmailFailed,
} from "../../../utils/emailOutbox";

type Data = {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: string }>
) {
  // Accept both GET (Vercel Cron) and POST (admin dashboard / manual trigger)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authorization: cron secret or admin API secret
  const secret =
    req.headers.authorization?.replace("Bearer ", "") ||
    (req.query.secret as string | undefined) ||
    "";
  const expected = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const jobs = await getPendingEmails(10);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const job of jobs) {
    if (!job.id) continue;

    try {
      const result = await sendMail(job.to, job.subject, job.text, job.html);
      await markEmailSent(job.id, result.messageId);
      sent++;
    } catch (err: any) {
      const errMsg = String(err?.message || err || "Unknown error");
      await markEmailFailed(job.id, errMsg, job.attempts || 0);
      failed++;
      errors.push(`${job.id}: ${errMsg}`);
    }
  }

  console.log(
    `[process-email-outbox] Processed ${jobs.length} jobs: ${sent} sent, ${failed} failed`
  );

  return res.status(200).json({
    processed: jobs.length,
    sent,
    failed,
    errors,
  });
}
