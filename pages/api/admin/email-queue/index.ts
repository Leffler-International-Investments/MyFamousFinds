// FILE: /pages/api/admin/email-queue/index.ts
// List emails in the outbox with optional status filter

import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAllEmails,
  getEmailStats,
  EmailJob,
  EmailJobStatus,
} from "../../../../utils/emailOutbox";

type Result = {
  ok: boolean;
  emails: EmailJob[];
  stats: Record<EmailJobStatus, number>;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      emails: [],
      stats: { pending: 0, sent: 0, failed: 0, dead: 0 },
      error: "Method not allowed",
    });
  }

  try {
    const status = req.query.status as EmailJobStatus | undefined;
    const limit = Number(req.query.limit) || 50;

    const [emails, stats] = await Promise.all([
      getAllEmails({ status, limit }),
      getEmailStats(),
    ]);

    return res.status(200).json({
      ok: true,
      emails,
      stats,
    });
  } catch (err: any) {
    console.error("[email-queue] Error:", err);
    return res.status(500).json({
      ok: false,
      emails: [],
      stats: { pending: 0, sent: 0, failed: 0, dead: 0 },
      error: err?.message || "Internal error",
    });
  }
}
