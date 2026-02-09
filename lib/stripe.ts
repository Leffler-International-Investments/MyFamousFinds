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
  const trimmed = (raw || "").trim();
  return { trimmed, hadWhitespace: raw.length !== trimmed.length };
}

function looksLikeSecretKey(k: string) {
  return k.startsWith("sk_live_") || k.startsWith("sk_test_");
}

/**
 * FIX:
 * Prefer ENV STRIPE_SECRET_KEY first (Vercel source of truth).
 * Fall back to Firestore ONLY if env is missing.
 *
 * This prevents stale Firestore keys from breaking LIVE Checkout.
 */
export async function getStripeSecretKeyInfo(): Promise<StripeSecretKeyInfo> {
  const envRaw = process.env.STRIPE_SECRET_KEY || "";
  const { trimmed: envKey, hadWhitespace: envHadWhitespace } = normalizeKey(envRaw);

  // ✅ Prefer env first
  if (envKey) {
    if (!looksLikeSecretKey(envKey)) {
      console.warn("[stripe] STRIPE_SECRET_KEY does not look like a Stripe secret key (sk_...).");
    }
    return { key: envKey, source: "env", hadWhitespace: envHadWhitespace };
  }

  // Fallback: Firestore (only if env missing)
  if (adminDb) {
    try {
      const snap = await adminDb.collection("admin").doc("stripe_settings").get();
      if (snap.exists) {
        const data = snap.data();
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
    // apiVersion is optional; Stripe SDK defaults are fine for most apps.
    timeout: 15000,
    maxNetworkRetries: 2,
  });

  cachedStripe = { key, client };
  return client;
}

/**
 * ✅ EXPORT REQUIRED BY /pages/api/checkout.ts
 * Your checkout API imports { createCheckoutSession } from "../../lib/stripe"
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
 * ✅ Keep a named export `stripe` for any code that imports { stripe }.
 * It will be a real Stripe client when STRIPE_SECRET_KEY is set.
 * (If missing, it will be null at runtime.)
 */
const envKeyNow = (process.env.STRIPE_SECRET_KEY || "").trim();
export const stripe: Stripe | null = envKeyNow
  ? new Stripe(envKeyNow, { timeout: 15000, maxNetworkRetries: 2 })
  : null;
