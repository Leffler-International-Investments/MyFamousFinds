// utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || "service@myfamousfinds.com";

// Warn if missing envs (shows in Vercel logs)
if (!host || !user || !pass) {
  console.warn("[email] Missing SMTP configuration. Emails will NOT be sent.", {
    host,
    user,
  });
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 587 = STARTTLS, 465 = SSL
  auth: { user, pass },
  tls: {
    // avoids some TLS issues on serverless hosts
    rejectUnauthorized: false,
  },
});

// Generic helper
async function sendMail(to: string, subject: string, text: string) {
  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured – skipping send");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    console.log("[email] sent", { to, messageId: info.messageId });
  } catch (err) {
    console.error("[email] error sending mail", err);
    // Let the API route see the error so it can return ok:false
    throw err;
  }
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
 */
export async function sendSellerInviteEmail(args: {
  to: string;
  businessName?: string;
  registerUrl?: string;
  [key: string]: any;
}) {
  const { to, businessName, registerUrl } = args;

  const subject = "Your Seller Application is Approved — Welcome to Famous Finds";
  const text = `Hi${businessName ? " " + businessName : ""},

Welcome to Famous Finds — your seller application has been approved!

Next steps:
1) Log into the Seller Portal.
2) Complete your seller profile (name + payout details, if applicable).
3) Upload your first listing with clear photos and all required fields.
4) If moderation is required, our team will review and approve listings before they go live.

Seller portal setup link:
${registerUrl ?? ""}

Need help? Contact us at support@myfamousfinds.com.`;

  await sendMail(to, subject, text);
}

/**
 * Seller rejection email used when an admin rejects a seller
 */
export async function sendSellerRejectionEmail(args: {
  to: string;
  businessName?: string;
  reason?: string;
  [key: string]: any;
}) {
  const { to, businessName, reason } = args;

  const subject = "Your seller application on Famous Finds";
  const text = `Hi${businessName ? " " + businessName : ""},

Thank you for applying to become a seller on Famous Finds.

After reviewing your application, we’re unable to approve it at this time.${
    reason ? "\n\nReason: " + reason : ""
  }

You’re welcome to contact us or reapply in the future.`;

  await sendMail(to, subject, text);
}

/**
 * Order confirmation email payload type
 */
export type OrderEmailPayload = {
  to?: string; // <-- now optional
  customerEmail?: string;
  subject?: string;
  text?: string;
  orderId?: string;
  total?: number;
  currency?: string;
  items?: {
    name: string;
    quantity: number;
    price?: number;
    brand?: string;
    category?: string;
    [key: string]: any;
  }[];
  [key: string]: any;
};

/**
 * Order confirmation email used from Stripe webhook / API
 */
export async function sendOrderConfirmationEmail(
  payload: OrderEmailPayload
): Promise<void> {
  const {
    to,
    customerEmail,
    subject,
    text,
    orderId,
    total,
    currency,
    items,
  } = payload;

  const recipient = to || customerEmail;
  if (!recipient) {
    console.warn("[email] sendOrderConfirmationEmail: no recipient email");
    return;
  }

  const finalSubject = subject || "Your Famous Finds order confirmation";

  const itemsText =
    items && items.length
      ? "\n\nItems:\n" +
        items
          .map(
            (it) =>
              `- ${it.name} x ${it.quantity}${
                it.price ? ` (${it.price} ${currency ?? ""})` : ""
              }`
          )
          .join("\n")
      : "";

  const finalText =
    text ||
    `Thank you for your order on Famous Finds.${
      orderId ? `\n\nOrder ID: ${orderId}` : ""
    }${
      typeof total === "number"
        ? `\nTotal: ${total} ${currency ?? ""}`
        : ""
    }${itemsText}\n\nIf you have any questions, reply to this email.`;

  await sendMail(recipient, finalSubject, finalText);
}
