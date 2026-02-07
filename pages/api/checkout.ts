// FILE: /pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "../../lib/stripe";

type RequestBody = {
  id: string; // listing id
  title: string; // product title
  price: number; // in major units (USD dollars)
  image?: string; // optional image URL
};

type SuccessResponse = { ok: true; sessionId: string };
type ErrorResponse = { ok: false; error: string };

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

    const baseUrl =
      (req.headers.origin as string | undefined) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.myfamousfinds.com";

    // createCheckoutSession now reads the Stripe key from Firestore first
    // (set via Management → Stripe Settings), falling back to env var.
    const session = await createCheckoutSession({
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
              images: image ? [image] : [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/product/${id}`,
    });

    return res.status(200).json({ ok: true, sessionId: session.id });
  } catch (err: any) {
    const msg = String(err?.message || err || "Stripe error");
    console.error("Stripe checkout error:", msg, err);

    let userMessage = msg;
    if (msg.includes("Expired API Key")) {
      userMessage =
        "The Stripe API key has expired. Please update it in Management → Stripe Settings.";
    } else if (msg.includes("retried") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      userMessage =
        "We're having trouble connecting to our payment provider. Please try again in a moment.";
    } else if (msg.includes("not configured")) {
      userMessage =
        "Payments are not configured yet. Please contact support.";
    }

    return res.status(500).json({ ok: false, error: userMessage });
  }
}
