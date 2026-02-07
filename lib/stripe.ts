// FILE: /lib/stripe.ts
import Stripe from "stripe";
import { adminDb } from "../utils/firebaseAdmin";

type StripeSecretKeyInfo = {
  key: string;
  source: "firestore" | "env" | "none";
  hadWhitespace: boolean;
};

let cachedStripe: { key: string; client: Stripe } | null = null;

export async function getStripeSecretKeyInfo(): Promise<StripeSecretKeyInfo> {
  const envRaw = process.env.STRIPE_SECRET_KEY || "";
  const envTrimmed = envRaw.trim();
  const envHadWhitespace = envRaw.length !== envTrimmed.length;

  if (adminDb) {
    try {
      const snap = await adminDb.collection("admin").doc("stripe_settings").get();
      if (snap.exists) {
        const data = snap.data();
        const raw = String(data?.secretKey || "");
        const trimmed = raw.trim();
        if (trimmed) {
          return {
            key: trimmed,
            source: "firestore",
            hadWhitespace: raw.length !== trimmed.length,
          };
        }
      }
    } catch (err) {
      console.warn("Failed to load Stripe settings from Firestore:", err);
    }
  }

  if (envTrimmed) {
    return { key: envTrimmed, source: "env", hadWhitespace: envHadWhitespace };
  }

  return { key: "", source: "none", hadWhitespace: false };
}

export async function getStripeClient(): Promise<Stripe | null> {
  const { key } = await getStripeSecretKeyInfo();
  if (!key) {
    console.warn("Stripe disabled: no secret key found in settings or env");
    return null;
  }

  if (cachedStripe?.key === key) {
    return cachedStripe.client;
  }

  const client = new Stripe(key, {
    timeout: 15000,
    maxNetworkRetries: 2,
  });

  cachedStripe = { key, client };
  return client;
}

// Helper wrappers that fail clearly at runtime if Stripe is not configured
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
) {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY or save Stripe settings in admin."
    );
  }
  return stripe.checkout.sessions.create(params);
}

export async function retrieveCheckoutSession(id: string) {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured on the server. Set STRIPE_SECRET_KEY or save Stripe settings in admin."
    );
  }
  return stripe.checkout.sessions.retrieve(id);
}
