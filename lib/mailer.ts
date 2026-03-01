// FILE: /lib/mailer.ts
// Reusable password-reset email sender.
// Delegates actual transport (AWS SES → SMTP fallback) to utils/email.ts.

import { sendMail } from "../utils/email";

/**
 * Send a password-reset email with a branded HTML template.
 * @param to    Recipient email address
 * @param resetUrl  The full URL the seller should click (our own /seller/reset-password?oobCode=…)
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const subject = "My Famous Finds — Reset your password";

  const text =
    "Hello,\n\n" +
    "We received a request to reset your password on My Famous Finds.\n\n" +
    "Click the link below to set a new password:\n\n" +
    `${resetUrl}\n\n` +
    "This link will expire in 1 hour.\n\n" +
    "If you did not request this, you can safely ignore this email.\n\n" +
    "Regards,\nThe My Famous Finds Team";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 28px 0;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;font-family:ui-serif,'Times New Roman',serif;">My Famous Finds</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:24px 28px 8px;">
            <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.6;">Hello,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
              We received a request to reset your seller account password. Click the button below to choose a new password:
            </p>
            <p style="text-align:center;margin:0 0 20px;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:#111827;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
            </p>
            <p style="margin:0 0 14px;font-size:13px;color:#6b7280;line-height:1.5;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;word-break:break-all;line-height:1.4;">${resetUrl}</p>
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">This link will expire in 1 hour.</p>
            <p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
              If you did not request this, you can safely ignore this email &mdash; your password will not be changed.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px 24px;border-top:1px solid #f3f4f6;margin-top:16px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              &copy; My Famous Finds &mdash; Authenticated luxury, delivered.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await sendMail(to, subject, text, html);
}
