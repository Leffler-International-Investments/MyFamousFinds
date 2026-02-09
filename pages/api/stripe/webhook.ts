FILE: /pages/api/stripe/webhook.ts
// FILE: /pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "../webhooks/stripe";

/**
 * IMPORTANT (Stripe webhooks)
 * - bodyParser MUST be disabled
 * - this file forwards to the canonical webhook handler:
 *   /pages/api/webhooks/stripe.ts
 */

export const config = {
  api: { bodyParser: false },
};

export default async function stripeWebhookProxy(req: NextApiRequest, res: NextApiResponse) {
  return handler(req, res);
}
