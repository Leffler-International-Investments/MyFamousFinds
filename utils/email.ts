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
    console.warn("[email] SMTP not configured – skipping send", { to, subject });
    return;
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });

  console.log("[email] sent", { to, messageId: info.messageId, subject });
}

/* ─────────────────────────────────────────────────────────────
   🔹 SELLER VETTING EMAILS (NEW)
───────────────────────────────────────────────────────────── */

export async function sendSellerApplicationReceivedEmail(args: {
  to: string;
  businessName?: string;
  contactName?: string;
  supportEmail?: string;
}) {
  const { to, businessName, contactName, supportEmail } = args;

  const subject = "We received your Seller Application — MyFamousFinds";
  const text =
    `Hi${contactName ? " " + contactName : ""},\n\n` +
    `Thanks for applying to become a seller on MyFamousFinds.\n\n` +
    `We received your application${businessName ? ` for: ${businessName}` : ""}.\n` +
    `Our team is now reviewing it. You will receive a second email once your application is approved or rejected.\n\n` +
    `If you have any questions, contact: ${supportEmail || "support@myfamousfinds.com"}\n\n` +
    `— MyFamousFinds Team`;

  await sendMail(to, subject, text);
}

/* ─────────────────────────────────────────────────────────────
   🔹 TEST EMAIL (SMTP verification)
───────────────────────────────────────────────────────────── */

export async function sendTestEmail(to: string) {
  const subject = "MyFamousFinds SMTP Test";
  const text =
    "SMTP is working.\n\n" +
    "This is a test email from MyFamousFinds.\n\n" +
    "If you received this email, seller emails WILL be sent on purchase.";

  await sendMail(to, subject, text);
}

/* ─────────────────────────────────────────────────────────────
   🔹 ORDER CONFIRMATION (BUYER)
───────────────────────────────────────────────────────────── */

export type OrderEmailPayload = {
  id: string;
  customerName?: string;
  customerEmail: string;
  currency: string;
  items: Array<{
    name: string;
    brand?: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping?: number;
  total: number;
};

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  const {
    id,
    customerName,
    customerEmail,
    currency,
    items,
    subtotal,
    shipping = 0,
    total,
  } = payload;

  const subject = `Order Confirmation — MyFamousFinds (Order ${id})`;

  const lines: string[] = [];
  lines.push(`Hi${customerName ? " " + customerName : ""},`);
  lines.push("");
  lines.push("Thank you for your purchase on MyFamousFinds.");
  lines.push("");
  lines.push(`Order ID: ${id}`);
  lines.push("");
  lines.push("Items:");

  for (const it of items) {
    const label = [it.brand, it.name].filter(Boolean).join(" — ");
    lines.push(`• ${label} ×${it.quantity} (${formatMoney(it.price, currency)})`);
  }

  lines.push("");
  lines.push(`Subtotal: ${formatMoney(subtotal, currency)}`);
  if (shipping > 0) {
    lines.push(`Shipping: ${formatMoney(shipping, currency)}`);
  }
  lines.push(`Total: ${formatMoney(total, currency)}`);
  lines.push("");
  lines.push("If you have any questions, simply reply to this email.");
  lines.push("");
  lines.push("— MyFamousFinds Team");

  await sendMail(customerEmail, subject, lines.join("\n"));
}

function formatMoney(amount: number, currency: string) {
  const n = Number(amount || 0);
  const c = String(currency || "USD").toUpperCase();
  try {
    return n.toLocaleString("en-US", { style: "currency", currency: c });
  } catch {
    return `${c} ${n.toFixed(2)}`;
  }
}

/* ─────────────────────────────────────────────────────────────
   🔹 AUTH / SELLER EMAILS (EXISTING)
───────────────────────────────────────────────────────────── */

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

${reason ? `Reason:\n${reason}\n\n` : ""}If you believe this is an error or wish to reapply, please contact:
${supportEmail || "support@myfamousfinds.com"}

Regards,
MyFamousFinds Team`;

  await sendMail(to, subject, text);
}

export async function sendSellerSoldShipNowEmail(args: {
  to: string;
  orderId: string;
  listingTitle: string;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddressText: string;
  shipByText: string;
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

Ship by:
${shipByText}

Buyer:
${buyerName || "Buyer"}${buyerEmail ? ` (${buyerEmail})` : ""}

Shipping address:
${shippingAddressText}

Next steps:
1) Ship with SIGNATURE REQUIRED
2) Enter tracking in Seller Portal → Orders → Mark Shipped

Support: support@myfamousfinds.com`;

  await sendMail(to, subject, text);
}
