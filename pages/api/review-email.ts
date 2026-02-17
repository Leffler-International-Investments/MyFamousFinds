// FILE: pages/api/review-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "../../utils/email";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  process.env.AWS_SES_FROM ||
  "admin@myfamousfinds.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  try {
    const { rating, comment, appName } = req.body || {};

    const stars = "★".repeat(Number(rating) || 0) + "☆".repeat(5 - (Number(rating) || 0));

    const subject = `${appName || "Famous Finds"} — New ${rating}-Star Review`;

    const text =
      `New review received on ${appName || "Famous Finds"}:\n\n` +
      `Rating: ${stars} (${rating}/5)\n` +
      `Comment: ${comment || "(no comment)"}\n\n` +
      `— Sent automatically by the Review Widget`;

    const html =
      `<div style="font-family:sans-serif;max-width:500px;">` +
      `<h2 style="margin:0 0 8px;">New Review Received</h2>` +
      `<p style="margin:4px 0;font-size:24px;color:#eab308;">${stars}</p>` +
      `<p style="margin:4px 0;"><b>Rating:</b> ${rating}/5</p>` +
      `<div style="margin:12px 0;padding:12px;background:#f1f5f9;border-radius:8px;">` +
      `<p style="margin:0;font-size:14px;color:#334155;">"${comment || "(no comment)"}"</p>` +
      `</div>` +
      `<p style="font-size:12px;color:#94a3b8;">Sent by the ${appName || "Famous Finds"} Review Widget</p>` +
      `</div>`;

    await sendMail(ADMIN_EMAIL, subject, text, html);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("review-email error", err);
    return res.status(500).json({ success: false, error: err?.message || "server_error" });
  }
}
