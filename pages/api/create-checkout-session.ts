// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../utils/firebaseAdmin";
import { getStripeClient } from "../../lib/stripe";

type SuccessResponse = {
  ok: true;
  sessionId: string;
  url: string;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    console.error("Missing Stripe secret key (env or admin settings)");
    return res
      .status(500)
      .json({ ok: false, error: "Stripe is not configured on the server." });
  }

  try {
    const { listingId, quantity = 1 } = req.body as {
      listingId?: string;
      quantity?: number;
    };

    if (!listingId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing listingId in request body." });
    }

    // ─────────────────────────────────────────────
    // 1) Fetch listing from Firestore
    // ─────────────────────────────────────────────
    const listingSnap = await adminDb.collection("listings").doc(listingId).get();

    if (!listingSnap.exists) {
      return res
        .status(404)
        .json({ ok: false, error: "Listing not found for checkout." });
    }

    const listing = listingSnap.data() || {};
    const price = Number(listing.price || 0);
    if (!price || Number.isNaN(price)) {
      return res
        .status(400)
        .json({ ok: false, error: "Listing has no valid price." });
    }

    const title: string = listing.title || listing.name || "Famous Finds item";
    const currency: string = (listing.currency || "usd").toLowerCase();

    // IMPORTANT (Marketplace Flow):
    // MyFamousFinds is the merchant of record.
    // Funds MUST land in the platform Stripe account first.
    // Sellers do NOT connect to Stripe at this stage.
    // Payouts happen AFTER delivery + signature + cooling period.
    // Therefore, we DO NOT route funds to any connected account here.

    const unitAmount = Math.round(price * 100); // convert to cents

    // ─────────────────────────────────────────────
    // 2) Build success / cancel URLs
    // ─────────────────────────────────────────────
    const origin = resolveBaseUrl(req);

    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/product/${listingId}?canceled=1`;

    // ─────────────────────────────────────────────
    // 3) Create Checkout Session
    // ─────────────────────────────────────────────
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],

      // We need a real shipping address to allow seller shipping + signature required delivery.
      shipping_address_collection: {
        allowed_countries: [
          "AU",
          "US",
          "GB",
          "CA",
          "NZ",
          "IE",
          "FR",
          "ES",
          "IT",
          "DE",
          "NL",
          "BE",
          "CH",
          "SE",
          "NO",
          "DK",
          "SG",
          "HK",
          "AE",
        ],
      },
      line_items: [
        {
          quantity,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: title,
              metadata: {
                listingId,
              },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        listingId,
      },
    };

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      if (!session.id || !session.url) {
        console.error("Stripe session missing id or url", session);
        return res
          .status(500)
          .json({ ok: false, error: "Unable to create Stripe session." });
      }

      return res.status(200).json({
        ok: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (err: any) {
      if (
        err?.code === "url_invalid" ||
        String(err?.message || "").includes("URL must be")
      ) {
        const fallbackOrigin = "https://www.myfamousfinds.com";
        const fallbackSession = await stripe.checkout.sessions.create({
          ...sessionParams,
          success_url: `${fallbackOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${fallbackOrigin}/product/${listingId}?canceled=1`,
        });
        return res.status(200).json({
          ok: true,
          sessionId: fallbackSession.id,
          url: fallbackSession.url!,
        });
      }
      throw err;
    }
  } catch (err: any) {
    console.error("create-checkout-session-error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error while creating checkout session.",
    });
  }
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
      if (origin.length <= 2000) {
        return origin;
      }
    } catch {
      // ignore invalid URL
    }
  }

  return "https://www.myfamousfinds.com";
}
