// FILE: /pages/api/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStripeClient } from "../../lib/stripe";
import { adminDb } from "../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const stripe = await getStripeClient();
  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured" });
  }

  try {
    const { listingId, title, amount, currency, image, buyerReturnUrl } = req.body || {};

    if (!listingId) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "firebase_not_configured" });
    }

    // ✅ CRITICAL: server-side validation (authoritative listing price + status)
    const listingRef = adminDb.collection("listings").doc(String(listingId));
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "listing_not_found" });
    }

    const listing: any = listingSnap.data() || {};
    const status = String(listing.status || "").toLowerCase();
    const isSold = listing.isSold === true || listing.sold === true || status === "sold";
    if (isSold) {
      return res.status(409).json({ ok: false, error: "listing_sold" });
    }

    const listingPrice =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    if (!Number.isFinite(listingPrice) || listingPrice <= 0) {
      return res.status(400).json({ ok: false, error: "invalid_listing_price" });
    }

    const finalTitle = String(listing.title || listing.name || title || "Item").trim();
    const listingImage =
      listing.displayImageUrl ||
      listing.display_image_url ||
      listing.imageUrl ||
      listing.image_url ||
      listing.image ||
      (Array.isArray(listing.images) ? listing.images[0] : "") ||
      image ||
      "";

    // Currency is currently USD platform-wide (matches checkout.ts)
    const safeCurrency = String(currency || listing.currency || "usd").toLowerCase();

    // Ignore client amount; trust Firestore price.
    const unitAmount = Math.round(Number(listingPrice) * 100);

    if (!Number.isFinite(unitAmount) || unitAmount < 50) {
      return res.status(400).json({ ok: false, error: "invalid_amount" });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (req.headers.origin as string) ||
      "http://localhost:3000";

    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel`;

    const sessionParams: any = {
      mode: "payment",
      payment_method_types: ["card"],
      metadata: { listingId: String(listingId) },

      shipping_address_collection: {
        allowed_countries: [
          "AU","US","GB","CA","NZ","IE","FR","ES","IT","DE","NL","BE","CH","SE","NO","DK","SG","HK","AE",
        ],
      },
      billing_address_collection: "required",
      customer_creation: "always",
      phone_number_collection: { enabled: true },

      line_items: [
        {
          price_data: {
            currency: safeCurrency,
            product_data: {
              name: String(finalTitle),
              images: listingImage ? [String(listingImage)] : undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],

      success_url: buyerReturnUrl ? String(buyerReturnUrl) : successUrl,
      cancel_url: cancelUrl,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "server_error" });
  }
}
