// FILE: /lib/stripe.ts
import Stripe from "stripe";
import { adminDb } from "../utils/firebaseAdmin";

// ─── Stripe key resolution ───────────────────────────────────────
// Priority:
//   1. Firestore  admin/stripe_settings → secretKey  (set via Management dashboard)
//   2. process.env.STRIPE_SECRET_KEY                   (set in Vercel env vars)
// This ensures that when an admin rotates keys in the dashboard the
// checkout immediately uses the new key without a redeploy.
// ──────────────────────────────────────────────────────────────────

let cachedKey: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60_000; // re-read Firestore at most once per minute

/**
 * Resolve the Stripe secret key: Firestore first, env var fallback.
 * Result is cached for 60 s so hot paths don't add a Firestore read
 * on every single request.
 */
export async function getStripeSecretKey(): Promise<string> {
  const now = Date.now();

  if (cachedKey && now < cacheExpiry) {
    return cachedKey;
  }

  // 1) Try Firestore
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("admin")
        .doc("stripe_settings")
        .get();

      if (snap.exists) {
        const data = snap.data();
        const fsKey = (data?.secretKey || "").trim();
        if (fsKey) {
          cachedKey = fsKey;
          cacheExpiry = now + CACHE_TTL_MS;
          return cachedKey;
        }
      }
    } catch (err) {
      console.warn("Could not read Stripe key from Firestore:", err);
    }
  }

  // 2) Fallback to env var
  const envKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (envKey) {
    cachedKey = envKey;
    cacheExpiry = now + CACHE_TTL_MS;
    return cachedKey;
  }

  throw new Error(
    "Stripe is not configured. Set STRIPE_SECRET_KEY or update keys in Management → Stripe Settings."
  );
}

/**
 * Build a Stripe client from the resolved key.
 * Each call may return a fresh instance if the key changed.
 */
export async function getStripeClient(): Promise<Stripe> {
  const key = await getStripeSecretKey();
  return new Stripe(key, {
    timeout: 15000,
    maxNetworkRetries: 2,
  });
}

// ─── Legacy exports (kept for backward compat) ──────────────────
// Module-level instance based on the env var only.  Used by files
// that `import { stripe }` directly.  Prefer getStripeClient() for
// new code – it picks up Firestore key changes automatically.
const envKey = (process.env.STRIPE_SECRET_KEY || "").trim();
let stripe: Stripe | null = null;

if (envKey) {
  stripe = new Stripe(envKey, {
    timeout: 15000,
    maxNetworkRetries: 2,
  });
} else {
  console.warn("Stripe disabled: STRIPE_SECRET_KEY is not set");
}

export { stripe };

// Helper wrappers – now use the dynamic key resolver
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  const client = await getStripeClient();
  return client.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  const client = await getStripeClient();
  return client.checkout.sessions.retrieve(id);
}
