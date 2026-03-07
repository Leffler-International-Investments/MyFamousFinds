// FILE: /lib/mailer.ts
// Reusable password-reset email sender.
// Delegates actual transport (AWS SES → SMTP fallback) to utils/email.ts.

import { sendMail, brandedEmailWrapper, escapeHtml } from "../utils/email";

/**
 * Send a password-reset email with a branded HTML template.
 * @param to    Recipient email address
 * @param resetUrl  The full URL the seller should click (our own /seller/reset-password?oobCode=…)
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const subject = "Famous Finds — Reset Your Password";

  const text =
    "Hello,\n\n" +
    "We received a request to reset your password on Famous Finds.\n\n" +
    "Click the link below to set a new password:\n\n" +
    `${resetUrl}\n\n` +
    "This link will expire in 1 hour.\n\n" +
    "If you did not request this, you can safely ignore this email.\n\n" +
    "Regards,\nThe Famous Finds Team";

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>` +
    `<p style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1c1917;">Reset Your Password</p>` +
    `<p style="margin:0 0 20px 0;">We received a request to reset your account password. Click the button below to choose a new password:</p>` +
    `<p style="margin:0 0 20px 0;text-align:center;">` +
    `<a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:14px 36px;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">RESET PASSWORD</a>` +
    `</p>` +
    `<p style="margin:0 0 8px 0;font-size:13px;color:#78716c;">Or copy and paste this link into your browser:</p>` +
    `<p style="margin:0 0 20px 0;font-size:12px;color:#a8a29e;word-break:break-all;">${escapeHtml(resetUrl)}</p>` +
    `<p style="margin:0 0 8px 0;font-size:12px;color:#a8a29e;">This link will expire in 1 hour.</p>` +
    `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">If you did not request this, you can safely ignore this email &mdash; your password will not be changed.</p>`;

  const html = brandedEmailWrapper(bodyHtml);

  await sendMail(to, subject, text, html);
}
