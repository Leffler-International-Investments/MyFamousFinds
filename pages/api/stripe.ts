// FILE: /pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "./webhooks/stripe";

/**
 * Stripe webhook consolidation
 *
 * Canonical webhook handler is now:
 *   /pages/api/webhooks/stripe.ts
 *
 * This legacy endpoint is kept as a safe proxy so older Stripe webhook
 * configurations don't break, while still ensuring a SINGLE handler executes.
 */

export const config = {
  api: { bodyParser: false },
};

export default async function stripeWebhookLegacyProxy(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handler(req, res);
}
