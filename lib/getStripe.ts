// FILE: /lib/getStripe.ts
import { Stripe, loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publicKey) {
      throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};
