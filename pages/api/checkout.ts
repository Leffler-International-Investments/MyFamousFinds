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

  // Optional: if you collect buyer details in-app before checkout.
  // Stripe will still collect shipping/billing/phone based on sessionParams below.
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

function sanitizeImageUrl(imageUrl?: string) {
  const trimmed = String(imageUrl || "").trim();
  if (!trimmed || trimmed.length > 2048) return "";
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
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

    // If buyerDetails are provided, ensure they're not partially empty.
    // (We do NOT require them by default because Stripe will collect billing/shipping/phone.)
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
              images: safeImageUrl ? [safeImageUrl] : [],
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
