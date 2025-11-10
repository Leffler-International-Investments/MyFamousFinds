// FILE: utils/email.ts
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

// ---------- Login code ----------

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
  <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111;">
    <p>Here is your <strong>Famous Finds</strong> sign-in code:</p>
    <p style="font-size:20px;font-weight:700;letter-spacing:0.2em;margin:16px 0;">${code}</p>
    <p>If you didn’t request this code, you can safely ignore this email.</p>
  </div>
  `;

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

// ---------- Order confirmation email ----------

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

  const vipUrl =
    process.env.VIP_URL ||
    process.env.NEXT_PUBLIC_VIP_URL ||
    "https://famous-finds.com/front-floor-vip";

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);

  const greetingName = customerName || "there";

  const subject = `Your Famous Finds order #${id}`;

  const itemsRowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;">
          <strong>${item.brand ? item.brand + " — " : ""}${item.name}</strong>
          <div style="font-size:12px;color:#555;">
            Qty: ${item.quantity}${item.category ? " • " + item.category : ""}
          </div>
        </td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">
          ${money(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111;">
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
          <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #111;">Item</th>
          <th style="text-align:right;padding:4px 8px;border-bottom:2px solid #111;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
        <tr>
          <td style="padding:4px 8px;text-align:right;border-top:1px solid #ddd;">Subtotal</td>
          <td style="padding:4px 8px;text-align:right;border-top:1px solid #ddd;">${money(
            subtotal
          )}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;text-align:right;">Shipping</td>
          <td style="padding:4px 8px;text-align:right;">${money(shipping)}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;text-align:right;font-weight:bold;">Total</td>
          <td style="padding:4px 8px;text-align:right;font-weight:bold;">${money(total)}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="margin-top:24px;">Complete your look</h3>
    <p>
      If you’d like, our AI Butler can show you <strong>matching pieces</strong> –
      bags, shoes, jewelry and accessories that go perfectly with your new purchase.
      Simply visit Famous Finds and ask the Butler what you’re looking for.
    </p>

    <h3 style="margin-top:24px;">Join the Famous Finds Front Floor VIP Club</h3>
    <p>
      It’s very advisable to join our
      <strong>Famous Finds Front Floor VIP Club</strong>.
      You’ll earn points on purchases, get early access to new arrivals,
      and receive exclusive member-only offers.
    </p>
    <p>
      👉 <a href="${vipUrl}" style="color:#111;font-weight:bold;">
        Click here to join the VIP Club
      </a>
    </p>

    <p style="margin-top:24px;">Warm regards,<br/>Famous Finds Concierge</p>
  </div>
  `;

  const text = `
Dear ${greetingName},

Congratulations on your purchase!

Here is your Famous Finds order receipt.

Order ID: ${id}

Items:
${items
  .map(
    (i) =>
      `- ${i.brand ? i.brand + " — " : ""}${i.name} (qty ${
        i.quantity
      }) – ${money(i.price * i.quantity)}`
  )
  .join("\n")}

Subtotal: ${money(subtotal)}
Shipping: ${money(shipping)}
Total:    ${money(total)}

Complete your look:
Ask the AI Butler on Famous Finds to show you matching pieces for your new item.

Join the Famous Finds Front Floor VIP Club:
You’ll earn points on purchases, get early access to new arrivals and receive member-only offers.
Join here: ${vipUrl}

Warm regards,
Famous Finds Concierge
`.trim();

  await transporter.sendMail({
    from: SMTP_FROM,
    to: customerEmail,
    subject,
    text,
    html,
  });
}
