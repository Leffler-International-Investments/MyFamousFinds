// FILE: /pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "./webhooks/stripe";

/**
 * Legacy Stripe webhook endpoint (kept as a proxy).
 * This prevents duplicate order creation if someone mistakenly configures Stripe
 * to call /api/stripe instead of /api/stripe/webhook.
 */

export const config = {
  api: { bodyParser: false },
};

export default async function stripeLegacyProxy(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handler(req, res);
}
