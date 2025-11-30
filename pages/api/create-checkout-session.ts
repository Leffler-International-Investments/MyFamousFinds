// FILE: /pages/api/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "../../utils/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }

    // Fetch product from Firestore
    const doc = await adminDb.collection("listings").doc(productId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = doc.data();

    // Check if seller has a Stripe Connected Account
    if (!product.sellerStripeId) {
      return res.status(400).json({ error: "Seller has no Stripe account" });
    }

    // Format price correctly (Stripe needs cents)
    const amount = Math.round(Number(product.price) * 100);

    // Create Stripe session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: product.title,
                description: product.description || "",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/product/${productId}`,
      },
      {
        stripeAccount: product.sellerStripeId,
      }
    );

    return res.status(200).json({ url: session.url });

  } catch (error: any) {
    console.error("STRIPE CHECKOUT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
