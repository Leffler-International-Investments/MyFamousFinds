// FILE: /utils/email.ts
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM ||
  (SMTP_USER ? `Famous Finds <${SMTP_USER}>` : "Famous Finds <no-reply@famous-finds.com>");

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    "[email] SMTP env vars missing; emails will fail until SMTP_HOST, SMTP_USER, SMTP_PASS are set."
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth:
    SMTP_USER && SMTP_PASS
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        }
      : undefined,
});

// ---------- Login code (2FA) ----------

export async function sendLoginCode(to: string, code: string) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  const subject = "Your Famous Finds sign-in code";

  const text = `
Use this code to sign in to Famous Finds:

${code}

If you didn’t request this, you can safely ignore this email.
`.trim();

  const html = `
  <p>Use this code to sign in to <strong>Famous Finds</strong>:</p>
  <p style="font-size:24px;font-weight:700;letter-spacing:4px;margin:16px 0;">
    ${code}
  </p>
  <p style="font-size:13px;color:#6b7280;">
    If you didn’t request this, you can safely ignore this email.
  </p>
  `.trim();

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

// ---------- Order confirmation ----------

export type OrderEmailItem = {
  name: string;
  brand?: string;
  category?: string;
  quantity: number;
  price: number; // single unit price in major units
};

export type OrderEmailPayload = {
  id: string;
  customerName?: string;
  customerEmail: string;
  currency?: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping?: number;
  total: number;
};

export async function sendOrderConfirmationEmail(order: OrderEmailPayload) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  const {
    id,
    customerName,
    customerEmail,
    currency = "USD",
    items,
    subtotal,
    shipping = 0,
    total,
  } = order;

  const greetingName =
    (customerName && customerName.trim()) ||
    (customerEmail && customerEmail.split("@")[0]) ||
    "there";

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);

  const subject = `Your Famous Finds order #${id}`;

  const lines = items
    .map(
      (i) =>
        `${i.name}${i.brand ? ` (${i.brand}` + (i.category ? ` – ${i.category})` : ")") : ""} × ${
          i.quantity
        } – ${money(i.price * i.quantity)}`
    )
    .join("\n");

  const text = `
Dear ${greetingName},

🎉 Congratulations on your purchase!

You’ve just secured a beautiful piece from Famous Finds.

Order ID: ${id}

Items:
${lines}

Subtotal: ${money(subtotal)}
Shipping: ${money(shipping)}
Total: ${money(total)}

Thank you for shopping with Famous Finds.
`.trim();

  const rowsHtml = items
    .map((i) => {
      const lineTotal = i.price * i.quantity;
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;">${i.name}</div>
            ${
              i.brand || i.category
                ? `<div style="font-size:12px;color:#6b7280;">
                    ${[i.brand, i.category].filter(Boolean).join(" · ")}
                   </div>`
                : ""
            }
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">
            ${i.quantity}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${money(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;">
    <p>Dear ${greetingName},</p>

    <p>🎉 <strong>Congratulations on your purchase!</strong></p>
    <p>
      You’ve just secured a beautiful piece from <strong>Famous Finds</strong>.
      We hope you enjoy it for many years to come.
    </p>

    <h3 style="margin-top:20px;">Your order receipt</h3>

    <p><strong>Order ID:</strong> ${id}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr>
          <th align="left" style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">Item</th>
          <th align="center" style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">Qty</th>
          <th align="right" style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      <tr>
        <td align="right" style="padding:2px 0;">Subtotal:</td>
        <td align="right" style="padding:2px 0;width:120px;">${money(subtotal)}</td>
      </tr>
      <tr>
        <td align="right" style="padding:2px 0;">Shipping:</td>
        <td align="right" style="padding:2px 0;width:120px;">${money(shipping)}</td>
      </tr>
      <tr>
        <td align="right" style="padding:6px 0;font-weight:700;border-top:1px solid #e5e7eb;">Total:</td>
        <td align="right" style="padding:6px 0;width:120px;font-weight:700;border-top:1px solid #e5e7eb;">
          ${money(total)}
        </td>
      </tr>
    </table>

    <p style="margin-top:20px;font-size:13px;color:#6b7280;">
      Thank you for shopping with <strong>Famous Finds</strong>.
    </p>
  </div>
  `.trim();

  await transporter.sendMail({
    from: SMTP_FROM,
    to: customerEmail,
    subject,
    text,
    html,
  });
}

// ---------- Seller invite / rejection emails ----------

type SellerInviteEmailParams = {
  to: string;
  businessName?: string;
  registerUrl: string;
};

export async function sendSellerInviteEmail({
  to,
  businessName,
  registerUrl,
}: SellerInviteEmailParams) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  const name =
    businessName && businessName.trim().length > 0
      ? businessName.trim()
      : "there";

  const subject = "You’re approved to sell on Famous Finds";

  const text = `
Hi ${name},

Good news – your seller application has been approved 🎉

Please finish setting up your seller account and create your password here:

${registerUrl}

If you didn’t request this, you can safely ignore this email.
`.trim();

  const html = `
  <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;">
    <p>Hi ${name},</p>
    <p>Good news – your seller application on <strong>Famous Finds</strong> has been approved 🎉</p>
    <p>Please finish setting up your seller account and create your password here:</p>
    <p>
      <a href="${registerUrl}" style="display:inline-block;padding:10px 18px;background:#000;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">
        Complete your seller setup
      </a>
    </p>
    <p style="margin-top:16px;font-size:13px;color:#4b5563;">
      If the button doesn’t work, paste this link into your browser:<br/>
      <span style="word-break:break-all;">${registerUrl}</span>
    </p>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
      If you didn’t request this, you can safely ignore this email.
    </p>
  </div>
  `.trim();

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

type SellerRejectionEmailParams = {
  to: string;
  businessName?: string;
  reason?: string;
};

export async function sendSellerRejectionEmail({
  to,
  businessName,
  reason,
}: SellerRejectionEmailParams) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  const name =
    businessName && businessName.trim().length > 0
      ? businessName.trim()
      : "there";

  const subject = "Your Famous Finds seller application";

  const extraReason =
    reason && reason.trim().length > 0
      ? `\n\nReason: ${reason.trim()}`
      : "";

  const text = `
Hi ${name},

Thank you for applying to sell on Famous Finds.

After reviewing your application, we’re not able to approve it at this time.${extraReason}

You’re welcome to reply to this email if you believe this was in error or if you have additional information you’d like us to consider.
`.trim();

  const reasonHtml =
    reason && reason.trim().length > 0
      ? `<p><strong>Reason:</strong> ${reason.trim()}</p>`
      : "";

  const html = `
  <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;">
    <p>Hi ${name},</p>
    <p>Thank you for applying to sell on <strong>Famous Finds</strong>.</p>
    <p>
      After reviewing your application, we’re not able to approve it at this time.
    </p>
    ${reasonHtml}
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
      You’re welcome to reply to this email if you believe this was in error or if you have
      additional information you’d like us to consider.
    </p>
  </div>
  `.trim();

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
