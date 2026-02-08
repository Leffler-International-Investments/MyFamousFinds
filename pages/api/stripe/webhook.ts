// FILE: /pages/api/stripe/webhook.ts

/**
 * Stripe webhook (Pages Router)
 * ✅ Next.js 16 + Turbopack fix:
 *    DO NOT re-export `config` from another module.
 *    Define `config` inline in this file.
 *
 * This file keeps BOTH URLs working.
 */

import type { NextApiHandler } from "next";
import handler from "../webhooks/stripe";

// ✅ Must be defined inline (NOT re-exported) for Turbopack/Next to recognize it.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the imported handler is treated as a Next API handler
export default handler as NextApiHandler;
