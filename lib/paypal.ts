// FILE: /lib/paypal.ts
// PayPal REST API helper

const PAYPAL_API_BASE =
  (process.env.PAYPAL_API_BASE || "").trim() ||
  (process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com");

let cachedToken: { token: string; expiresAt: number } | null = null;

// Log the resolved PayPal environment at startup for diagnostics
console.log(
  `[PayPal] Configured: base=${PAYPAL_API_BASE} env=${process.env.PAYPAL_ENV || "(not set)"} ` +
  `clientId=${(process.env.PAYPAL_CLIENT_ID || "").trim() ? "set" : "MISSING"} ` +
  `secret=${(process.env.PAYPAL_CLIENT_SECRET || "").trim() ? "set" : "MISSING"}`
);

/**
 * Get an OAuth2 access token from PayPal (client-credentials grant).
 * Cached until ~5 minutes before expiry.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
  const secret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

  if (!clientId || !secret) {
    throw new Error("PayPal not configured (missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET).");
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    // Provide clear diagnostic info for the most common PayPal auth failure
    if (res.status === 401) {
      const isSandboxUrl = PAYPAL_API_BASE.includes("sandbox");
      console.error(
        `[PayPal] 401 invalid_client — AUTHENTICATION FAILED\n` +
        `  API Base URL: ${PAYPAL_API_BASE}\n` +
        `  Environment: ${isSandboxUrl ? "SANDBOX" : "LIVE"}\n` +
        `  Client ID starts with: ${clientId.slice(0, 8)}…\n` +
        `  Secret length: ${secret.length} chars\n` +
        `  PAYPAL_ENV env var: ${process.env.PAYPAL_ENV || "(not set)"}\n` +
        `\n  COMMON CAUSES:\n` +
        `  1. Sandbox credentials used with Live API URL (or vice versa)\n` +
        `  2. Wrong PAYPAL_CLIENT_SECRET (copied from wrong app, rotated, or has extra spaces)\n` +
        `  3. Vercel env vars not applied to Production (updated Development but not Production)\n` +
        `\n  FIX: In Vercel → Settings → Environment Variables, ensure PAYPAL_CLIENT_ID,\n` +
        `  PAYPAL_CLIENT_SECRET, and PAYPAL_API_BASE are set for the correct environment,\n` +
        `  then redeploy.`
      );
    }
    throw new Error(`PayPal auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const expiresIn = Number(data.expires_in || 3600);

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 300) * 1000, // refresh 5 min early
  };

  return cachedToken.token;
}

/**
 * Convenience wrapper around fetch with PayPal auth.
 */
export async function paypalFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getPayPalAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(`${PAYPAL_API_BASE}${path}`, {
    ...options,
    headers,
  });
}

/**
 * Create a PayPal order (v2 Orders API).
 */
export async function createPayPalOrder(params: {
  listingId: string;
  title: string;
  amount: number;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
  buyerEmail?: string;
  metadata?: Record<string, string>;
}) {
  const currency = (params.currency || "USD").toUpperCase();
  const amountStr = params.amount.toFixed(2);

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: params.listingId,
        description: params.title.slice(0, 127),
        custom_id: params.listingId,
        amount: {
          currency_code: currency,
          value: amountStr,
          breakdown: {
            item_total: { currency_code: currency, value: amountStr },
          },
        },
        items: [
          {
            name: params.title.slice(0, 127),
            unit_amount: { currency_code: currency, value: amountStr },
            quantity: "1",
            category: "PHYSICAL_GOODS",
          },
        ],
      },
    ],
    application_context: {
      brand_name: "Famous Finds",
      landing_page: "LOGIN",
      user_action: "PAY_NOW",
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      shipping_preference: "GET_FROM_FILE",
    },
    ...(params.buyerEmail
      ? { payer: { email_address: params.buyerEmail } }
      : {}),
  };

  const res = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal create order failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Capture an approved PayPal order.
 */
export async function capturePayPalOrder(orderId: string) {
  const res = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal capture failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Get PayPal order details.
 */
export async function getPayPalOrder(orderId: string) {
  const res = await paypalFetch(`/v2/checkout/orders/${orderId}`);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal get order failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Create a PayPal payout (Payouts API — requires PayPal to enable Payouts on your merchant).
 */
export async function createPayPalPayout(params: {
  recipientEmail: string;
  amount: number;
  currency?: string;
  note?: string;
  senderBatchId: string;
}) {
  const currency = (params.currency || "USD").toUpperCase();

  const body = {
    sender_batch_header: {
      sender_batch_id: params.senderBatchId,
      email_subject: "You have a payout from Famous Finds",
      email_message:
        "You have received a payout for a sale on Famous Finds. Thank you for selling with us!",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: params.amount.toFixed(2),
          currency: currency,
        },
        receiver: params.recipientEmail,
        note: params.note || "Famous Finds seller payout",
        sender_item_id: params.senderBatchId,
      },
    ],
  };

  const res = await paypalFetch("/v1/payments/payouts", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal payout failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Verify a PayPal webhook signature.
 */
export async function verifyPayPalWebhook(params: {
  webhookId: string;
  headers: Record<string, string>;
  body: string;
}): Promise<boolean> {
  let parsedEvent: any;
  try {
    parsedEvent = JSON.parse(params.body);
  } catch {
    console.error("[verifyPayPalWebhook] Failed to parse webhook body as JSON");
    return false;
  }

  const verifyBody = {
    auth_algo: params.headers["paypal-auth-algo"],
    cert_url: params.headers["paypal-cert-url"],
    transmission_id: params.headers["paypal-transmission-id"],
    transmission_sig: params.headers["paypal-transmission-sig"],
    transmission_time: params.headers["paypal-transmission-time"],
    webhook_id: params.webhookId,
    webhook_event: parsedEvent,
  };

  const res = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify(verifyBody),
  });

  if (!res.ok) return false;

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
