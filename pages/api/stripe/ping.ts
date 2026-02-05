// FILE: /pages/api/stripe/ping.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

type Resp =
  | { ok: true; mode: "live" | "test"; accountId?: string }
  | { ok: false; error: string };

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY missing" });
    }

    const stripe = new Stripe(key, {});
    const acct = await stripe.accounts.retrieve();

    // acct has an "id" and indicates the account exists / key works
    return res.status(200).json({
      ok: true,
      mode: key.includes("_live_") ? "live" : "test",
      accountId: acct.id,
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "stripe_error");
    console.error("stripe_ping_error", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
