// FILE: /lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  return await stripe.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  return await stripe.checkout.sessions.retrieve(id);
}
