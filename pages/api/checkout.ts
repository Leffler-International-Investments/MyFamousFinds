// FILE: pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe";

type Body = {
  id: string;
  title: string;
  price: string; // e.g. "US$2,450"
};

const priceToCents = (price: string): number => {
  const numeric = Number(price.replace(/[^0-9.]/g, "")) || 0;
  return Math.round(numeric * 100);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { id, title, price } = req.body as Body;
    const unitAmount = priceToCents(price);
    const origin = req.headers.origin ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: title,
            },
          },
        },
      ],
      success_url: `${origin}/product/${id}?status=success`,
      cancel_url: `${origin}/product/${id}?status=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error", error);
    return res
      .status(500)
      .json({ error: error.message ?? "Unable to create checkout session" });
  }
}
