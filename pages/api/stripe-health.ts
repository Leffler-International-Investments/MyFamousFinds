// FILE: /pages/api/stripe-health.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getStripeClient, getStripeSecretKeyInfo } from "../../lib/stripe";

type Resp =
  | {
      ok: true;
      mode: "live" | "test";
      keySource: "env" | "firestore" | "none";
      accountId?: string;
      chargesEnabled?: boolean;
      payoutsEnabled?: boolean;
      detailsSubmitted?: boolean;
    }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const info = await getStripeSecretKeyInfo();
  const stripe = await getStripeClient();

  if (!stripe) {
    return res.status(500).json({
      ok: false,
      error: "Stripe not configured (no STRIPE_SECRET_KEY).",
    });
  }

  try {
    const acct = await stripe.accounts.retrieve();
    const livemode = Boolean((acct as any).livemode);

    return res.status(200).json({
      ok: true,
      mode: livemode ? "live" : "test",
      keySource: info.source,
      accountId: (acct as any).id,
      chargesEnabled: Boolean((acct as any).charges_enabled),
      payoutsEnabled: Boolean((acct as any).payouts_enabled),
      detailsSubmitted: Boolean((acct as any).details_submitted),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err || "Stripe health check failed"),
    });
  }
}
