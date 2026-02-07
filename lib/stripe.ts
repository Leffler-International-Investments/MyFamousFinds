// FILE: /lib/stripe.ts
import Stripe from "stripe";

// Safely initialize Stripe so missing env vars do NOT break the build
const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();

let stripe: Stripe | null = null;

if (secretKey) {
  stripe = new Stripe(secretKey, {
    // Vercel serverless functions have limited execution time.
    // Set a shorter timeout so we get a clear error instead of hanging.
    timeout: 15000, // 15 seconds
    maxNetworkRetries: 2,
  });
} else {
  // Do NOT throw here – just log. This keeps Vercel builds working
  // even if Stripe is not configured yet.
  console.warn("Stripe disabled: STRIPE_SECRET_KEY is not set");
}

export { stripe };

// Helper wrappers that fail clearly at runtime if Stripe is not configured
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY to enable payments."
    );
  }
  return stripe.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY to enable payments."
    );
  }
  return stripe.checkout.sessions.retrieve(id);
}
