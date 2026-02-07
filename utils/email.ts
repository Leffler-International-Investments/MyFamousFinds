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
  try {
    const info = await transporter.sendMail({ from, to, subject, text });
    console.log("[email] sent", { to, messageId: info.messageId });
  } catch (err) {
    console.error("[email] error sending mail", err);
    throw err;
  }
}

export async function sendLoginCode(to: string, code: string) {
  const subject = "Your Famous Finds Verification Code";
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

  const subject = "Your Seller Application is Approved — Welcome to Famous Finds";
  const text = `Hi${businessName ? " " + businessName : ""},

Welcome to Famous Finds — your seller application has been approved!

Next steps:
1) Log into the Seller Portal.
2) Complete your seller profile.
3) Upload your first listing.

Seller portal setup link:
${registerUrl ?? ""}

Need help? Contact us at support@myfamousfinds.com.`;

  await sendMail(to, subject, text);
}

// ✅ NEW: Sold label email with buyer shipping details
export async function sendSellerSoldShipNowEmail(args: {
  to: string;
  orderId: string;
  listingTitle: string;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddressText: string;
  shipByText: string; // e.g. "within 72 hours"
}) {
  const { to, orderId, listingTitle, buyerName, buyerEmail, shippingAddressText, shipByText } =
    args;

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
1) Pack item carefully
2) Ship with SIGNATURE REQUIRED
3) Enter tracking number in Seller Portal (Orders → Mark Shipped)

Support: support@myfamousfinds.com
`;

  await sendMail(to, subject, text);
}
