// FILE: /pages/api/checkout.ts
// --- This is the replacement file provided in your instructions ---
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe"; // Assuming this path is correct
import { auth } from "../../utils/firebaseClient"; // <-- Import auth
import { getAuth } from "firebase-admin/auth"; // <-- Import admin auth
import { admin } from "../../utils/firebaseAdmin"; // <-- Import admin

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { id, title, price, image } = req.body as RequestBody;

    if (!id || !title || !price) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing product data" });
    }

    // --- GET VIP USER ID (if logged in) ---
    let userId = null;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        // We use admin auth here to verify the token sent from the client
        const decodedToken = await getAuth(admin).verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (authError) {
        console.warn("Invalid auth token provided to checkout:", authError);
        // Don't block the purchase, just don't award points
      }
    }
    // ----------------------------------------

    // Get the base URL for Stripe's success/cancel redirects
    const baseUrl = req.headers.origin || "http://localhost:3000";

    // Create a new Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "afterpay_clearpay"],
      mode: "payment",

      // --- THIS BLOCK WAS ADDED/UPDATED ---
      // Attach metadata so the webhook can update Firestore + VIP points
      metadata: {
        listingId: id,
        // Pass the verified userId (if it exists) to the webhook
        userId: userId || undefined,
      },
      // --- END OF ADDED BLOCK ---

      // We pass the product info to Stripe
      line_items: [
        {
          price_data: {
            currency: "usd",
            // Stripe expects price in cents, so multiply by 100
            unit_amount: Math.round(price * 100),
            product_data: {
              name: title,
              images: image ? [image] : [],
              metadata: {
                productId: id,
              },
            },
          },
          quantity: 1,
        },
      ],

      // Set the redirect URLs
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/product/${id}`, // Send user back to the product
    });

    // Send the session ID back to the frontend
    res.status(200).json({ ok: true, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe Error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Stripe session creation failed" });
  }
}

// Define the expected body from the frontend
type RequestBody = {
  id: string;
  title: string;
  price: number; // Price in dollars (e.g., 2450)
  image: string;
};
