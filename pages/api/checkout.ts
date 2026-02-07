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
 * Fallback: create a fresh Stripe instance if the shared one fails.
 * Handles edge cases where the module-level instance hits a transient
 * network error on cold start.
 */
async function createSessionFallback(
  params: Stripe.Checkout.SessionCreateParams
) {
  const { key } = await getStripeSecretKeyInfo();
  if (!key) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY or save Stripe settings in admin."
    );
  }

  const freshStripe = new Stripe(key, {
    timeout: 20000,
    maxNetworkRetries: 1,
  });

  return freshStripe.checkout.sessions.create(params);
}

function resolveCheckoutBaseUrl(req: NextApiRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || "";
  const fromHeader = (req.headers.origin as string | undefined) || "";

  const candidates = [fromEnv, fromHeader].filter(Boolean);
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    try {
      const url = new URL(trimmed);
      const origin = url.origin;
      if (origin.length <= 2000) {
        return origin;
      }
    } catch {
      // ignore invalid URL
    }
  }

  return "https://www.myfamousfinds.com";
}

function sanitizeCheckoutImageUrl(imageUrl?: string) {
  if (!imageUrl) return "";
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.length > 2048) return "";
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return "";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { id, title, price, image } = req.body as RequestBody;
    const buyerIdHeader =
      (req.headers["x-user-id"] as string | undefined) ||
      (req.headers["x-userid"] as string | undefined);

    if (!id || !title || typeof price !== "number") {
      return res.status(400).json({ ok: false, error: "Missing product data" });
    }

    const baseUrl = resolveCheckoutBaseUrl(req);

    const safeImageUrl = sanitizeCheckoutImageUrl(image);
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      metadata: {
        listingId: id,
        ...(buyerIdHeader ? { buyerId: buyerIdHeader } : {}),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
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
      // Primary attempt via shared Stripe instance
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
        // Fallback: create a fresh Stripe instance
        session = await createSessionFallback(sessionParams);
      }
    }

    return res.status(200).json({ ok: true, sessionId: session.id });
  } catch (err: any) {
    const msg = String(err?.message || err || "Stripe error");
    console.error("Stripe checkout error:", msg, err);

    // Provide a user-friendly error message
    let userMessage = msg;
    if (msg.includes("retried") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      userMessage =
        "We're having trouble connecting to our payment provider. Please try again in a moment.";
    } else if (msg.includes("not configured") || msg.includes("SECRET_KEY")) {
      userMessage =
        "Payments are not configured yet. Please contact support.";
    }

    return res.status(500).json({ ok: false, error: userMessage });
  }
}
