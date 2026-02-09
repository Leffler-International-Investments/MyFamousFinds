// FILE: /pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createCheckoutSession } from "../../lib/stripe";

type RequestBody = {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: string;
  category?: string;

  buyerDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

type SuccessResponse = { ok: true; sessionId: string; url: string };
type ErrorResponse = { ok: false; error: string };

function resolveBaseUrl(req: NextApiRequest) {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const fromHeader = String(req.headers.origin || "").trim();

  for (const candidate of [fromEnv, fromHeader]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {}
  }
  return "https://www.myfamousfinds.com";
}

/**
 * Enhanced sanitization to ensure Stripe accepts the image URL.
 */
function sanitizeImageUrl(imageUrl?: string) {
  const trimmed = String(imageUrl || "").trim();
  if (!trimmed || trimmed.length > 2048) return "";
  
  try {
    const u = new URL(trimmed);
    // Stripe strictly requires http or https protocols.
    if (!["http:", "https:"].includes(u.protocol)) return "";
    
    // Return the full absolute URL including any necessary query tokens.
    return u.toString();
  } catch {
    // Return empty for relative paths as Stripe does not support them.
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
    const { id, title, price, image, brand, category, buyerDetails } =
      (req.body || {}) as RequestBody;

    const buyerIdHeader =
      (req.headers["x-user-id"] as string | undefined) ||
      (req.headers["x-userid"] as string | undefined);

    if (!id || !title || typeof price !== "number") {
      return res.status(400).json({ ok: false, error: "Missing product data" });
    }

    if (buyerDetails) {
      const requiredBuyerFields = [
        buyerDetails?.fullName,
        buyerDetails?.email,
        buyerDetails?.phone,
        buyerDetails?.addressLine1,
        buyerDetails?.city,
        buyerDetails?.state,
        buyerDetails?.postalCode,
        buyerDetails?.country,
      ];

      const missing = requiredBuyerFields.some((v) => !String(v || "").trim());
      if (missing) {
        return res.status(400).json({
          ok: false,
          error:
            "Missing buyer details. Please complete your details before checkout.",
        });
      }
    }

    const baseUrl = resolveBaseUrl(req);
    const safeImageUrl = sanitizeImageUrl(image);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["AU", "US", "GB", "CA", "NZ", "FR", "DE", "IT", "ES", "NL"],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        listingId: id,
        productTitle: String(title).slice(0, 120),
        ...(brand ? { brand: String(brand).slice(0, 120) } : {}),
        ...(category ? { category: String(category).slice(0, 120) } : {}),
        ...(buyerIdHeader ? { buyerId: buyerIdHeader } : {}),
        ...(buyerDetails?.fullName
          ? { buyerFullName: String(buyerDetails.fullName).slice(0, 120) }
          : {}),
        ...(buyerDetails?.email
          ? { buyerEmail: String(buyerDetails.email).slice(0, 120) }
          : {}),
        ...(buyerDetails?.phone
          ? { buyerPhone: String(buyerDetails.phone).slice(0, 60) }
          : {}),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: String(title).slice(0, 120),
              images: safeImageUrl ? [safeImageUrl] : [], // Pass sanitized URL to Stripe.
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/product/${id}`,
    };

    const session = await createCheckoutSession(sessionParams);

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      url: session.url || "",
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "Stripe error");
    console.error("Stripe checkout error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
