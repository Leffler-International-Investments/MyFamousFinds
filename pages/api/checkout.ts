// FILE: /pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createCheckoutSession } from "../../lib/stripe";
import { adminDb } from "../../utils/firebaseAdmin";

type RequestBody = {
  id: string;
  title: string;
  price: number; // client-supplied (server will validate against Firestore)
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
    return u.toString();
  } catch {
    // Stripe does not support relative paths.
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

    // ✅ CRITICAL: Server-side validation (prevents price tampering + sold-item checkout)
    if (!adminDb) {
      return res
        .status(500)
        .json({ ok: false, error: "Firebase Admin not configured" });
    }

    const listingRef = adminDb.collection("listings").doc(String(id));
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing: any = listingSnap.data() || {};
    const status = String(listing.status || "").toLowerCase();
    const isSold = listing.isSold === true || listing.sold === true || status === "sold";
    if (isSold) {
      return res.status(409).json({ ok: false, error: "Listing already sold" });
    }

    // Validate price against Firestore (authoritative)
    const listingPrice =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    if (!Number.isFinite(listingPrice) || listingPrice <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid listing price" });
    }

    // If client price doesn't match, trust Firestore price.
    const finalPrice = listingPrice;

    // Prefer Firestore fields (prevents client spoofing)
    const finalTitle = String(listing.title || listing.name || title || "Item");
    const finalBrand = String(listing.brand || listing.designer || brand || "");
    const finalCategory = String(listing.category || category || "");

    // Prefer Firestore image (but keep client as fallback)
    const listingImage =
      listing.displayImageUrl ||
      listing.display_image_url ||
      listing.imageUrl ||
      listing.image_url ||
      listing.image ||
      (Array.isArray(listing.images) ? listing.images[0] : "") ||
      image ||
      "";

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
    const safeImageUrl = sanitizeImageUrl(listingImage);

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
        productTitle: String(finalTitle).slice(0, 120),
        ...(finalBrand ? { brand: String(finalBrand).slice(0, 120) } : {}),
        ...(finalCategory ? { category: String(finalCategory).slice(0, 120) } : {}),
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
            unit_amount: Math.round(finalPrice * 100),
            product_data: {
              name: String(finalTitle).slice(0, 120),
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
