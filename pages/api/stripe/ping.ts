// FILE: /pages/api/stripe/ping.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getStripeSecretKeyInfo } from "../../../lib/stripe";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const { key, source, hadWhitespace } = await getStripeSecretKeyInfo();

    if (!key) {
      return res.status(500).json({
        ok: false,
        where: "settings",
        error: "STRIPE_SECRET_KEY missing",
      });
    }

    const stripe = new Stripe(key, {});

    // This call proves the server can authenticate + reach Stripe
    const acct = await stripe.accounts.retrieve();

    return res.status(200).json({
      ok: true,
      mode: key.includes("_live_") ? "live" : "test",
      source,
      hadWhitespace,
      accountId: acct.id,
      chargesEnabled: (acct as any).charges_enabled,
      payoutsEnabled: (acct as any).payouts_enabled,
    });
  } catch (err: any) {
    // Return the real Stripe connection diagnostics
    return res.status(500).json({
      ok: false,
      type: err?.type || null,
      code: err?.code || null,
      message: err?.message || String(err),
      errno: err?.errno || null,
      syscall: err?.syscall || null,
      hostname: err?.hostname || null,
    });
  }
}
