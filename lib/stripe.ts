// FILE: /lib/stripe.ts
import Stripe from "stripe";

// Safely initialize Stripe so missing env vars do NOT break the build
const secretKey = process.env.STRIPE_SECRET_KEY || "";

let stripe: Stripe | null = null;

if (secretKey) {
  // Keep options minimal to avoid apiVersion mismatch surprises
  stripe = new Stripe(secretKey, {});
} else {
  // Do NOT throw here — just log. This keeps Vercel builds working.
  // At runtime, calls that require Stripe will throw a clear error.
  console.warn("Stripe disabled: STRIPE_SECRET_KEY is not set");
}

/**
 * ✅ REQUIRED EXPORT
 * This is what pages/api/stripe.ts and webhooks expect.
 */
export async function getStripeClient(): Promise<Stripe | null> {
  return stripe;
}

/**
 * ✅ Backward-compatible named export
 * Some pages (like /pages/order/success.tsx) import { stripe } directly.
 */
export { stripe };

/**
 * Helper wrappers that fail clearly at runtime if Stripe is not configured
 */
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  const client = await getStripeClient();
  if (!client) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY to enable payments."
    );
  }
  return client.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  const client = await getStripeClient();
  if (!client) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY to enable payments."
    );
  }
  return client.checkout.sessions.retrieve(id);
}
