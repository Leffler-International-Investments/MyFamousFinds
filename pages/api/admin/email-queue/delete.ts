// FILE: /pages/api/admin/email-queue/delete.ts
// Delete a specific email job

import type { NextApiRequest, NextApiResponse } from "next";
import { deleteEmailJob } from "../../../../utils/emailOutbox";

type Result = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { jobId } = req.body as { jobId?: string };

    if (!jobId) {
      return res.status(400).json({ ok: false, error: "Missing jobId" });
    }

    const success = await deleteEmailJob(jobId);

    if (!success) {
      return res.status(404).json({ ok: false, error: "Email job not found" });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[email-queue/delete] Error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal error",
    });
  }
}
