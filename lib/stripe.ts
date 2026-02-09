
// FILE: /lib/stripe.ts
import Stripe from "stripe";
import { adminDb } from "../utils/firebaseAdmin";

/* -------------------------------------------------
   Types
------------------------------------------------- */
export type StripeSecretKeyInfo = {
  key: string;
  source: "env" | "firestore" | "none";
  hadWhitespace: boolean;
};

/* -------------------------------------------------
   Internal cache
------------------------------------------------- */
let cachedStripe: { key: string; client: Stripe } | null = null;

/* -------------------------------------------------
   Helpers
------------------------------------------------- */
function normalizeKey(raw: string) {
  const trimmed = (raw || "").trim();
  return { trimmed, hadWhitespace: raw.length !== trimmed.length };
}

function looksLikeSecretKey(k: string) {
  return k.startsWith("sk_live_") || k.startsWith("sk_test_");
}

/* -------------------------------------------------
   Secret key resolution
------------------------------------------------- */
export async function getStripeSecretKeyInfo(): Promise<StripeSecretKeyInfo> {
  const envRaw = process.env.STRIPE_SECRET_KEY || "";
  const { trimmed: envKey, hadWhitespace } = normalizeKey(envRaw);

  // Prefer ENV (Vercel source of truth)
  if (envKey) {
    if (!looksLikeSecretKey(envKey)) {
      console.warn("[stripe] STRIPE_SECRET_KEY does not look valid (sk_...)");
    }
    return { key: envKey, source: "env", hadWhitespace };
  }

  // Fallback: Firestore
  if (adminDb) {
    try {
      const snap = await adminDb.collection("admin").doc("stripe_settings").get();
      if (snap.exists) {
        const raw = String(snap.data()?.secretKey || "");
        const { trimmed, hadWhitespace } = normalizeKey(raw);
        if (trimmed) {
          return { key: trimmed, source: "firestore", hadWhitespace };
        }
      }
    } catch (err) {
      console.warn("[stripe] Failed loading Firestore Stripe key", err);
    }
  }

  return { key: "", source: "none", hadWhitespace: false };
}

/* -------------------------------------------------
   Stripe client (cached)
------------------------------------------------- */
export async function getStripeClient(): Promise<Stripe | null> {
  const { key } = await getStripeSecretKeyInfo();
  if (!key) {
    console.warn("[stripe] Stripe disabled: no secret key found in env or Firestore.");
    return null;
  }

  if (cachedStripe?.key === key) return cachedStripe.client;

  const client = new Stripe(key, {
    // apiVersion is optional; Stripe SDK defaults are fine for most apps.
    timeout: 15000,
    maxNetworkRetries: 2,
  });

  cachedStripe = { key, client };
  return client;
}

/**
 * BACKWARD-COMPAT EXPORTS
 * (DO NOT REMOVE — REQUIRED BY API ROUTES)
 */

// Used by pages/order/success.tsx
export const stripe: Stripe | null = cachedStripe?.client ?? null;

// Used by pages/api/checkout.ts
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  const client = await getStripeClient();
  if (!client) {
    throw new Error("Stripe not configured (missing STRIPE_SECRET_KEY).");
  }
  return await client.checkout.sessions.create(params);
}

/**
 * ✅ Keep a named export `stripe` for any code that imports { stripe }.
 * It will be a real Stripe client when STRIPE_SECRET_KEY is set.
 * (If missing, it will be null at runtime.)
 */
const envKeyNow = (process.env.STRIPE_SECRET_KEY || "").trim();
export const stripe: Stripe | null = envKeyNow
  ? new Stripe(envKeyNow, { timeout: 15000, maxNetworkRetries: 2 })
  : null;
