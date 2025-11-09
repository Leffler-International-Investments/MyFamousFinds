// FILE: /lib/stripe.ts
import Stripe from "stripe";

// Read and validate the secret key once
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Initialize Stripe client using the API version that matches this SDK's types
export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-10-29.clover",
});

// Reusable helpers

export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  return stripe.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  return stripe.checkout.sessions.retrieve(id);
}
