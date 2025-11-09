// FILE: /lib/stripe.ts
import Stripe from "stripe";

// Read and validate the secret key once so TypeScript knows it's a string
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Initialize Stripe client. We rely on the SDK's pinned API version,
// so we don't pass apiVersion explicitly (this avoids the previous type error).
export const stripe = new Stripe(stripeSecretKey);

// Helper: create a Checkout Session
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  return stripe.checkout.sessions.create(params);
}

// Helper: retrieve a Checkout Session
export async function retrieveCheckoutSession(id: string) {
  return stripe.checkout.sessions.retrieve(id);
}
