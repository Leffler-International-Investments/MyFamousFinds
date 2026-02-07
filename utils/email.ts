// FILE: /utils/email.ts

import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || "service@myfamousfinds.com";

if (!host || !user || !pass) {
  console.warn("[email] Missing SMTP configuration. Emails will NOT be sent.", {
    host,
    user,
  });
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
});

async function sendMail(to: string, subject: string, text: string) {
  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured – skipping send");
    return;
  }
  const info = await transporter.sendMail({ from, to, subject, text });
  console.log("[email] sent", { to, messageId: info.messageId });
}

export async function sendLoginCode(to: string, code: string) {
  const subject = "Your MyFamousFinds Verification Code";
  const text = `Your login verification code is: ${code}

Enter this code in the login screen to continue.`;
  await sendMail(to, subject, text);
}

export async function sendSellerInviteEmail(args: {
  to: string;
  businessName?: string;
  registerUrl?: string;
  [key: string]: any;
}) {
  const { to, businessName, registerUrl } = args;

  const subject = "Seller Application Approved — Welcome to MyFamousFinds";
  const text = `Hi${businessName ? " " + businessName : ""},

Your seller application has been APPROVED.

Next steps:
1) Log into the Seller Portal
2) Complete your seller profile
3) Upload your first listing

Seller portal link:
${registerUrl ?? ""}

Support: support@myfamousfinds.com`;

  await sendMail(to, subject, text);
}

// ✅ REQUIRED FIX: export the rejection email (build error)
export async function sendSellerRejectionEmail(args: {
  to: string;
  businessName?: string;
  reason?: string;
  supportEmail?: string;
}) {
  const { to, businessName, reason, supportEmail } = args;

  const subject = "Seller Application Update — Not Approved";
  const text = `Hi${businessName ? " " + businessName : ""},

Thank you for applying to sell on MyFamousFinds.

At this time, your seller application was NOT approved.

${reason ? `Reason (optional):\n${reason}\n\n` : ""}If you believe this is an error or you’d like to reapply, please contact:
${supportEmail || "support@myfamousfinds.com"}

Regards,
MyFamousFinds Team`;

  await sendMail(to, subject, text);
}

// ✅ Sold label email with buyer shipping details
export async function sendSellerSoldShipNowEmail(args: {
  to: string;
  orderId: string;
  listingTitle: string;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddressText: string;
  shipByText: string; // e.g. "within 72 hours"
}) {
  const {
    to,
    orderId,
    listingTitle,
    buyerName,
    buyerEmail,
    shippingAddressText,
    shipByText,
  } = args;

  const subject = `SOLD – SHIP NOW (Order ${orderId})`;
  const text = `Your item has been SOLD on MyFamousFinds.

Item:
${listingTitle}

Ship By:
${shipByText}

Buyer:
${buyerName || "Buyer"}${buyerEmail ? ` (${buyerEmail})` : ""}

Shipping Address:
${shippingAddressText}

Next steps:
1) Ship with SIGNATURE REQUIRED
2) Enter tracking number in Seller Portal → Orders → Mark Shipped

Support: support@myfamousfinds.com`;

  await sendMail(to, subject, text);
}
