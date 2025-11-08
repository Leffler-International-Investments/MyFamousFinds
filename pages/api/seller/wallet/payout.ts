// FILE: /pages/api/seller/wallet/payout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../../utils/authServer";
import { adminDb } from "../../../../utils/firebaseAdmin";
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Data = {
  ok: boolean;
  error?: string;
  payoutId?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // --- TODO: REPLACE MOCK DATA WITH STRIPE API CALLS ---
    //
    // 1. Get seller's Stripe Connect account ID
    //    const sellerDoc = await adminDb.collection('sellers').doc(sellerId).get();
    //    const stripeAccountId = sellerDoc.data()?.stripeAccountId;
    //
    // 2. Get available balance
    //    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });
    //    const available = balance.available.find(b => b.currency === 'usd')?.amount;
    //
    //    if (!available || available <= 0) {
    //      return res.status(400).json({ ok: false, error: "No available balance to pay out." });
    //    }
    //
    // 3. Create the payout
    //    const payout = await stripe.payouts.create({
    //      amount: available,
    //      currency: 'usd',
    //      method: 'instant', // This requires 'instant' payouts to be enabled
    //    }, { stripeAccount: stripeAccountId });
    //
    //    res.status(200).json({ ok: true, payoutId: payout.id });
    //

    // --- MOCK RESPONSE FOR DEVELOPMENT ---
    // Simulate a 1-second delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return a successful response
    res.status(200).json({ ok: true, payoutId: "po_mock_123456789" });
    //
    // --- To test an error, use this instead: ---
    // res.status(500).json({ ok: false, error: "Mock Error: Instant payouts not enabled." });
    //
    // --- END MOCK RESPONSE ---

  } catch (err: any) {
    console.error("Error creating payout:", err);
    // Handle real Stripe errors
    // if (err instanceof Stripe.errors.StripeError) {
    //   return res.status(400).json({ ok: false, error: err.message });
    // }
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
