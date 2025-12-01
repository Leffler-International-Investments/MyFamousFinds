// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../utils/firebaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY env var. Set it in Vercel before using checkout."
  );
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

type Data =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { productId, email } = req.body || {};

    if (!productId || typeof productId !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Missing or invalid productId" });
    }

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Missing or invalid email" });
    }

    // Load the listing from Firestore
    const productRef = adminDb.collection("listings").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return res
        .status(404)
        .json({ ok: false, error: "Listing not found in Firestore" });
    }

    const product: any = productSnap.data() || {};
    const price = Number(product.price || 0);

    if (!price || price <= 0) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "Invalid price configured for this listing.",
        });
    }

    const amount = Math.round(price * 100); // cents

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
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name:
                product.title ||
                product.name ||
                "Famous Finds marketplace listing",
              description: product.description || "",
            },
          },
        },
      ],
      success_url: `${siteUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/product/${productId}`,
      metadata: {
        productId,
        sellerId: product.sellerId || "",
      },
    };

    // ─────────────────────────────────────────────
    // CONNECT HANDLING (SAFE FALLBACK)
    // If sellerStripeId exists => send payment to that connected account.
    // If it does NOT exist => charge on the platform account so checkout still works.
    // ─────────────────────────────────────────────
    const sellerStripeId: string | undefined =
      (product as any).sellerStripeId || undefined;

    let session: Stripe.Checkout.Session;

    if (sellerStripeId) {
      // Full Connect flow (money goes straight to seller's connected account)
      session = await stripe.checkout.sessions.create(sessionParams, {
        stripeAccount: sellerStripeId,
      });
    } else {
      // Fallback: process on the platform account
      // (you can manually pay out the seller later)
      session = await stripe.checkout.sessions.create(sessionParams);
    }

    if (!session.url) {
      return res
        .status(500)
        .json({ ok: false, error: "Stripe did not return a checkout URL." });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({
      ok: false,
      error:
        err?.message ||
        "Unable to create Stripe checkout session. Please try again.",
    });
  }
}
