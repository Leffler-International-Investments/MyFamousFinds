// FILE: /pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createCheckoutSession, getStripeSecretKeyInfo } from "../../lib/stripe";

type RequestBody = {
  id: string; // listing id
  title: string; // product title
  price: number; // in major units (USD dollars)
  image?: string; // optional image URL
};

type SuccessResponse = { ok: true; sessionId: string };
type ErrorResponse = { ok: false; error: string };

/**
 * Fallback helper: create a checkout session using a fresh Stripe instance.
 */
async function createSessionFallback(params: Stripe.Checkout.SessionCreateParams) {
  let info: any = null;

  try {
    // ✅ FIX: getStripeSecretKeyInfo returns a Promise in this repo
    info = (await getStripeSecretKeyInfo?.()) ?? null;
  } catch {
    info = null;
  }

  const key =
    (info && typeof info === "object" ? info.key : "") ||
    process.env.STRIPE_SECRET_KEY ||
    "";

  if (!key) {
    throw new Error(
      "Stripe is not configured. Missing STRIPE_SECRET_KEY. Please set it in Vercel env vars."
    );
  }

  if (!key.startsWith("sk_")) {
    throw new Error(
      "Stripe secret key looks invalid (must start with sk_). Please verify Vercel env vars."
    );
  }

  const freshStripe = new Stripe(key, {
    timeout: 20000,
    maxNetworkRetries: 1,
  });

  return freshStripe.checkout.sessions.create(params);
}

function resolveBaseUrl(req: NextApiRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || "";
  const fromHeader = (req.headers.origin as string | undefined) || "";

  const candidates = [fromEnv, fromHeader].filter(Boolean);
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    try {
      const url = new URL(trimmed);
      const origin = url.origin;
      if (origin.length <= 2000) return origin;
    } catch {
      // ignore invalid URL
    }
  }

  return "https://www.myfamousfinds.com";
}

function sanitizeListingTitle(title: string) {
  const t = String(title || "").trim();
  if (!t) return "MyFamousFinds Purchase";
  return t.slice(0, 120);
}

function safeImage(image?: string) {
  const raw = String(image || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = (req.body || {}) as Partial<RequestBody>;
    const id = String(body.id || "").trim();
    const title = sanitizeListingTitle(body.title || "");
    const price = Number(body.price);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing listing id" });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid price" });
    }

    const baseUrl = resolveBaseUrl(req);
    const safeImageUrl = safeImage(body.image);

    const unitAmount = Math.round(price * 100); // USD cents

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: title,
              images: safeImageUrl ? [safeImageUrl] : [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/product/${id}`,
    };

    let session: Stripe.Checkout.Session;

    try {
      session = await createCheckoutSession(sessionParams);
    } catch (primaryErr: any) {
      if (
        primaryErr?.code === "url_invalid" ||
        String(primaryErr?.message || "").includes("URL must be")
      ) {
        const fallbackOrigin = "https://www.myfamousfinds.com";
        const fallbackParams: Stripe.Checkout.SessionCreateParams = {
          ...sessionParams,
          success_url: `${fallbackOrigin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${fallbackOrigin}/product/${id}`,
        };
        session = await createCheckoutSession(fallbackParams);
      } else {
        console.warn(
          "Primary Stripe checkout failed, trying fallback:",
          primaryErr?.message
        );
        session = await createSessionFallback(sessionParams);
      }
    }

    return res.status(200).json({ ok: true, sessionId: session.id });
  } catch (err: any) {
    const msg = String(err?.message || err || "Stripe error");
    console.error("Stripe checkout error:", msg, err);

    let userMessage = msg;
    if (msg.includes("Expired API Key")) {
      userMessage =
        "The Stripe API key has expired. Please update it in Management → Stripe Settings.";
    } else if (
      msg.includes("retried") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("timeout")
    ) {
      userMessage =
        "We're having trouble connecting to our payment provider. Please try again in a moment.";
    } else if (msg.includes("not configured")) {
      userMessage = "Payments are not configured yet. Please contact support.";
    }

    return res.status(500).json({ ok: false, error: userMessage });
  }
}
