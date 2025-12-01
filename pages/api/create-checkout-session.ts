// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../utils/firebaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

type SuccessResponse = {
  ok: true;
  url: string;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

type ResponseData = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const { productId, email, quantity } = req.body || {};

    if (!productId || typeof productId !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "missing_or_invalid_productId" });
    }

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "missing_or_invalid_email" });
    }

    const qty =
      typeof quantity === "number" && quantity > 0 ? quantity : 1;

    // 1) Load listing
    const listingRef = adminDb.collection("listings").doc(productId);
    const listingSnap = await listingRef.get();

    if (!listingSnap.exists) {
      return res
        .status(404)
        .json({ ok: false, error: "listing_not_found" });
    }

    const listing: any = listingSnap.data() || {};
    const price = Number(listing.price || listing.priceUsd || 0);

    if (!price || price <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "invalid_price" });
    }

    const amount = Math.round(price * 100); // cents

    // 2) Load platform commission from Firestore (admin/stripe_settings)
    let platformCommissionPct = 0;
    try {
      const settingsSnap = await adminDb
        .collection("admin")
        .doc("stripe_settings")
        .get();
      if (settingsSnap.exists) {
        const s: any = settingsSnap.data();
        const n = Number(s.platformCommission);
        if (!Number.isNaN(n) && n >= 0 && n <= 100) {
          platformCommissionPct = n;
        }
      }
    } catch (e) {
      console.warn("stripe_settings_read_failed", e);
    }

    const applicationFeeAmount =
      platformCommissionPct > 0
        ? Math.round((amount * platformCommissionPct) / 100)
        : 0;

    // 3) Resolve seller Stripe account ID
    let sellerStripeAccountId: string | undefined =
      listing.sellerStripeAccountId ||
      listing.sellerStripeId ||
      listing.stripeAccountId;

    const sellerId: string | undefined = listing.sellerId;

    if (!sellerStripeAccountId && sellerId) {
      try {
        const sellerRef = adminDb.collection("users").doc(sellerId);
        const sellerSnap = await sellerRef.get();
        const sellerData: any = sellerSnap.data() || {};
        sellerStripeAccountId =
          sellerData.stripeAccountId ||
          sellerData.stripeConnectId ||
          sellerData.sellerStripeId;
      } catch (e) {
        console.warn("seller_lookup_failed", e);
      }
    }

    // 4) Build Checkout Session params
    const siteUrl =
      (process.env.NEXT_PUBLIC_SITE_URL as string) ||
      (req.headers.origin as string) ||
      "https://myfamousfinds.com";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name:
                listing.title ||
                listing.name ||
                "Famous Finds marketplace listing",
              description: listing.description || "",
            },
          },
        },
      ],
      success_url: `${siteUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/product/${productId}`,
      metadata: {
        productId,
        sellerId: sellerId || "",
      },
    };

    // 5) If seller has a Stripe account → send payout there with fee
    if (sellerStripeAccountId) {
      sessionParams.payment_intent_data = {
        ...(applicationFeeAmount > 0
          ? { application_fee_amount: applicationFeeAmount }
          : {}),
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      };
    }

    // 6) Create session
    const session = await stripe.checkout.sessions.create(
      sessionParams
    );

    if (!session.url) {
      return res
        .status(500)
        .json({ ok: false, error: "missing_session_url" });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("create_checkout_session_error", err);
    return res.status(500).json({
      ok: false,
      error:
        err?.message ||
        "unable_to_create_checkout_session",
    });
  }
}
