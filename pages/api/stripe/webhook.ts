// FILE: /pages/api/stripe/webhook.ts
/**
 * Stripe webhook endpoint alias.
 *
 * Stripe Dashboard often gets configured as:
 *   https://www.myfamousfinds.com/api/stripe/webhook
 *
 * The main handler lives at:
 *   /pages/api/webhooks/stripe.ts   → /api/webhooks/stripe
 *
 * This file keeps BOTH URLs working.
 */
export { config } from "../webhooks/stripe";
export { default } from "../webhooks/stripe";
