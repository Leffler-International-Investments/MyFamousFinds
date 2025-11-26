// utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;

// Warn if missing envs (will show in Vercel logs)
if (!host || !user || !pass) {
  console.warn("[email] Missing SMTP configuration. Emails will NOT be sent.", {
    host,
    user,
  });
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // Gmail: 587 = STARTTLS, 465 = SSL
  auth: { user, pass },
});

// Generic helper
async function sendMail(to: string, subject: string, text: string) {
  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured – skipping send");
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

/**
 * 2FA login code email for admins/sellers
 */
export async function sendLoginCode(to: string, code: string) {
  const subject = "Your Famous Finds Verification Code";
  const text = `Your login verification code is: ${code}

Enter this code in the login screen to continue.`;
  await sendMail(to, subject, text);
}

/**
 * Seller invite email used when an admin approves a seller
 * Matches call style:
 *   await sendSellerInviteEmail({
 *     to: email,
 *     businessName,
 *     registerUrl,
 *     ...
 *   });
 */
export async function sendSellerInviteEmail(args: {
  to: string;
  businessName?: string;
  registerUrl?: string;
  [key: string]: any;
}) {
  const { to, businessName, registerUrl } = args;

  const subject = "You’ve been approved as a seller on Famous Finds";
  const text = `Hi${businessName ? " " + businessName : ""},

Your seller account has been approved on Famous Finds.

Click the link below to complete your setup and create your password:

${registerUrl ?? ""}

If you weren’t expecting this email, you can ignore it.`;

  await sendMail(to, subject, text);
}
