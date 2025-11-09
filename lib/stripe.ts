// FILE: /lib/stripe.ts
import Stripe from "stripe";

// Ensure the secret key exists before initializing
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Initialize Stripe client using default compatible API config
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

// Optionally, you can export helpers for reuse
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  return await stripe.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  return await stripe.checkout.sessions.retrieve(id);
}
