// FILE: /pages/api/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStripeClient } from "../../lib/stripe";

type Ok = { ok: true; url: string };
type Err = { ok: false; error: string };
type Resp = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured" });
  }

  try {
    const {
      listingId,
      title,
      amount,
      currency,
      image,
      buyerReturnUrl,
    } = req.body || {};

    if (!listingId || !title || !amount) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const safeCurrency = String(currency || "usd").toLowerCase();
    const unitAmount = Math.round(Number(amount) * 100);

    if (!Number.isFinite(unitAmount) || unitAmount < 50) {
      return res.status(400).json({ ok: false, error: "invalid_amount" });
    }

    // IMPORTANT: This must point back to your site
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (req.headers.origin as string) ||
      "http://localhost:3000";

    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel`;

    const sessionParams: any = {
      mode: "payment",
      payment_method_types: ["card"],

      // ✅ REQUIRED: so webhook can link payment to listing
      metadata: { listingId: String(listingId) },

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

      // ✅ REQUIRED: collect billing address for fraud/chargeback protection + receipts.
      billing_address_collection: "required",

      // ✅ REQUIRED: force Stripe to create a Customer for the buyer (so we reliably get customer_details).
      customer_creation: "always",

      // ✅ Recommended: capture phone number for delivery issues.
      phone_number_collection: { enabled: true },

      line_items: [
        {
          price_data: {
            currency: safeCurrency,
            product_data: {
              name: String(title),
              images: image ? [String(image)] : undefined,
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

    return res.status(200).json({ ok: true, url: session.url! });
  } catch (err: any) {
    console.error("create_checkout_session_error", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
