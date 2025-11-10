// FILE: pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe";

type RequestBody = {
  id: string;       // Firestore listing id
  title: string;    // listing.title
  price: number;    // in USD, e.g. 1111 for US$1,111
  image?: string;   // product image URL
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

    if (!id || !title || typeof price !== "number") {
      return res.status(400).json({ ok: false, error: "Missing product data" });
    }

    const baseUrl =
      req.headers.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "afterpay_clearpay"],
      mode: "payment",
      metadata: {
        listingId: id,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: title,
              images: image ? [image] : [],
              metadata: { productId: id },
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
    console.error("Stripe checkout error:", err?.message || err);
    return res
      .status(500)
      .json({ ok: false, error: "Stripe session creation failed" });
  }
}
