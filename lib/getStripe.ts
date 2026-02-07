// FILE: /lib/getStripe.ts
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

async function getPublishableKey(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  const res = await fetch("/api/stripe-public-key");
  const json = await res.json().catch(() => ({} as any));

  const key = String(json?.key || "").trim();
  if (!res.ok || !key) throw new Error(json?.error || "Missing Stripe publishable key");

  return key;
}

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = (async () => {
      const publicKey = await getPublishableKey();

      if (!publicKey.startsWith("pk_live_") && !publicKey.startsWith("pk_test_")) {
        console.warn("[stripe] Publishable key does not look like pk_live_/pk_test_.");
      }

      return loadStripe(publicKey);
    })();
  }
  return stripePromise;
};
