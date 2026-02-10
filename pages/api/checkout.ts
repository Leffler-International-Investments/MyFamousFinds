// FILE: /pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createCheckoutSession } from "../../lib/stripe";
import { adminDb } from "../../utils/firebaseAdmin";

type RequestBody = {
  id: string; // listingId
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

  // (legacy / ignored) - client-supplied fields are NOT trusted anymore
  title?: string;
  price?: number;
  image?: string;
  brand?: string;
  category?: string;
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
    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    const { id, buyerDetails } = (req.body || {}) as RequestBody;

    const buyerIdHeader =
      (req.headers["x-user-id"] as string | undefined) ||
      (req.headers["x-userid"] as string | undefined);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing listing id" });
    }

    // Require buyer details (delivery details before checkout)
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
    const buyerDetailsComplete = requiredBuyerFields.every(
      (value) => typeof value === "string" && value.trim().length > 0
    );
    if (!buyerDetailsComplete) {
      return res.status(400).json({ ok: false, error: "Missing buyer details" });
    }

    // ✅ Authoritative server-side listing validation (price/status/title/image/etc.)
    const listingRef = adminDb.collection("listings").doc(String(id));
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing: any = listingSnap.data() || {};
    const status = String(listing.status || "").toLowerCase();
    const isSold =
      listing.isSold === true || listing.sold === true || status === "sold";
    const isLive = status === "live";

    if (!isLive || isSold) {
      return res.status(409).json({ ok: false, error: "Listing not available" });
    }

    const listingPrice =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    if (!Number.isFinite(listingPrice) || listingPrice <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid listing price" });
    }

    const title = String(listing.title || listing.name || "Item").slice(0, 120);

    const rawImage =
      listing.displayImageUrl ||
      listing.display_image_url ||
      listing.imageUrl ||
      listing.image_url ||
      listing.image ||
      (Array.isArray(listing.images) ? listing.images[0] : "") ||
      "";

    const safeImageUrl = sanitizeImageUrl(rawImage);

    const brand = String(listing.brand || listing.designer || "").slice(0, 120);
    const category = String(listing.category || listing.menuCategory || "").slice(0, 120);

    const baseUrl = resolveBaseUrl(req);
    const trimMeta = (value?: string) => String(value || "").trim().slice(0, 200);

    // Stripe currency (keep platform default USD unless you’ve truly enabled multi-currency)
    const currency = String(listing.currency || "usd").toLowerCase() || "usd";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["AU", "US", "GB", "CA", "NZ", "FR", "DE", "IT", "ES", "NL"],
      },
      customer_email: buyerDetails?.email ? trimMeta(buyerDetails.email) : undefined,
      phone_number_collection: { enabled: true },

      metadata: {
        listingId: String(id),
        productTitle: title,
        ...(brand ? { brand } : {}),
        ...(category ? { category } : {}),
        ...(buyerDetails?.fullName ? { buyerName: trimMeta(buyerDetails.fullName) } : {}),
        ...(buyerDetails?.email ? { buyerEmail: trimMeta(buyerDetails.email) } : {}),
        ...(buyerDetails?.phone ? { buyerPhone: trimMeta(buyerDetails.phone) } : {}),
        ...(buyerDetails?.addressLine1 ? { shipLine1: trimMeta(buyerDetails.addressLine1) } : {}),
        ...(buyerDetails?.addressLine2 ? { shipLine2: trimMeta(buyerDetails.addressLine2) } : {}),
        ...(buyerDetails?.city ? { shipCity: trimMeta(buyerDetails.city) } : {}),
        ...(buyerDetails?.state ? { shipState: trimMeta(buyerDetails.state) } : {}),
        ...(buyerDetails?.postalCode ? { shipPostal: trimMeta(buyerDetails.postalCode) } : {}),
        ...(buyerDetails?.country ? { shipCountry: trimMeta(buyerDetails.country) } : {}),
        ...(buyerIdHeader ? { buyerId: buyerIdHeader } : {}),
      },

      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(listingPrice) * 100),
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
