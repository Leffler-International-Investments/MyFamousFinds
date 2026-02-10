// FILE: /lib/stripe.ts
import Stripe from "stripe";
import { adminDb } from "../utils/firebaseAdmin";

export type StripeSecretKeyInfo = {
  key: string;
  source: "env" | "firestore" | "none";
  hadWhitespace: boolean;
};

let cachedStripe: { key: string; client: Stripe } | null = null;

function normalizeKey(raw: string) {
  // Strip ALL whitespace (spaces, newlines, tabs, carriage returns) from
  // everywhere in the key – not just leading/trailing.  Vercel env-var
  // editors occasionally inject line-breaks when a value is pasted.
  const stripped = (raw || "").replace(/\s+/g, "");
  return { trimmed: stripped, hadWhitespace: raw.length !== stripped.length };
}

function looksLikeSecretKey(k: string) {
  return k.startsWith("sk_live_") || k.startsWith("sk_test_");
}

/**
 * Prefer ENV STRIPE_SECRET_KEY first (Vercel source of truth).
 * Fall back to Firestore ONLY if env is missing.
 */
export async function getStripeSecretKeyInfo(): Promise<StripeSecretKeyInfo> {
  const envRaw = process.env.STRIPE_SECRET_KEY || "";
  const { trimmed: envKey, hadWhitespace: envHadWhitespace } = normalizeKey(envRaw);

  if (envKey) {
    if (!looksLikeSecretKey(envKey)) {
      console.warn("[stripe] STRIPE_SECRET_KEY does not look like a Stripe secret key (sk_...).");
    }
    return { key: envKey, source: "env", hadWhitespace: envHadWhitespace };
  }

  if (adminDb) {
    try {
      const snap = await adminDb.collection("admin").doc("stripe_settings").get();
      if (snap.exists) {
        const data = snap.data() as any;
        const raw = String(data?.secretKey || "");
        const { trimmed, hadWhitespace } = normalizeKey(raw);
        if (trimmed) {
          if (!looksLikeSecretKey(trimmed)) {
            console.warn("[stripe] Firestore secretKey does not look like a Stripe secret key (sk_...).");
          }
          return { key: trimmed, source: "firestore", hadWhitespace };
        }
      }
    } catch (err) {
      console.warn("[stripe] Failed to load Stripe settings from Firestore:", err);
    }
  }

  return { key: "", source: "none", hadWhitespace: false };
}

export async function getStripeClient(): Promise<Stripe | null> {
  const { key } = await getStripeSecretKeyInfo();
  if (!key) {
    console.warn("[stripe] Stripe disabled: no secret key found in env or Firestore.");
    return null;
  }

  if (cachedStripe?.key === key) return cachedStripe.client;

  const client = new Stripe(key, {
    timeout: 15000,
    maxNetworkRetries: 2,
  });

  cachedStripe = { key, client };
  return client;
}

/**
 * Used by pages/api/checkout.ts
 */
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
 * Used by pages/order/success.tsx
 */
export async function retrieveCheckoutSession(
  sessionId: string,
  params?: Stripe.Checkout.SessionRetrieveParams
): Promise<Stripe.Checkout.Session> {
  const client = await getStripeClient();
  if (!client) {
    throw new Error("Stripe not configured (missing STRIPE_SECRET_KEY).");
  }
  return await client.checkout.sessions.retrieve(sessionId, params);
}
