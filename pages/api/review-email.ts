// FILE: pages/api/review-email.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  try {
    const { rating, comment, appName } = req.body || {};

    // Log the review notification (email sending can be integrated later)
    console.log(
      `[Review Email] ${appName} — ${rating} stars: ${comment}`
    );

    // TODO: Integrate your preferred email service (SendGrid, Resend, etc.)
    // For now this endpoint logs and acknowledges the review.

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("review-email error", err);
    return res.status(500).json({ success: false, error: err?.message || "server_error" });
  }
}
