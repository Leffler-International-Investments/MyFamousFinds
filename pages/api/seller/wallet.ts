// FILE: /pages/api/seller/wallet.ts
import type { NextApiRequest, NextApiResponse } from "next";
// Make sure these import paths are correct for your project
import { getSellerId } from "../../../utils/authServer"; 
import { adminDb } from "../../../utils/firebaseAdmin";
// You will need the node-stripe-sdk
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// These types match the frontend page
type PayoutRow = {
  id: string;
  date: string;
  amount: string;
  status: string;
  destination: string;
};

type BankAccount = {
  bankName: string;
  last4: string;
};

type WalletData = {
  available: number;
  upcoming: number;
  lifetime: number;
  payouts: PayoutRow[];
  account: BankAccount | null;
  upcomingDate: string | null;
};

type Data = {
  ok: boolean;
  wallet?: WalletData;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // --- TODO: REPLACE MOCK DATA WITH STRIPE API CALLS ---
    //
    // 1. Get the seller's Stripe Connect account ID
    //    const sellerDoc = await adminDb.collection('sellers').doc(sellerId).get();
    //    const stripeAccountId = sellerDoc.data()?.stripeAccountId;
    //
    // 2. Fetch Stripe Balance (available, pending)
    //    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });
    //    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
    //    const upcoming = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    //
    // 3. Fetch Stripe Account (bank details)
    //    const account = await stripe.accounts.retrieve(stripeAccountId);
    //    const externalAccount = account.external_accounts?.data[0] as Stripe.BankAccount;
    //
    // 4. Fetch Stripe Payouts (history)
    //    const payouts = await stripe.payouts.list({ stripeAccount: stripeAccountId, limit: 10 });
    //
    // 5. Fetch Lifetime Volume (you may need to get this from your own DB)
    //
    
    // --- MOCK DATA REMOVED ---
    // This is now live data, ready to be populated by your Stripe API calls above
    const liveWalletData: WalletData = {
      available: 0,
      upcoming: 0,
      lifetime: 0,
      account: null, // Set to null, Stripe will populate this
      upcomingDate: null, // Set to null, Stripe will populate this
      payouts: [], // Empty array, Stripe will populate this
    };
    // --- END LIVE DATA ---

    // When live, you will build this object from your Stripe responses
    res.status(200).json({ ok: true, wallet: liveWalletData });

  } catch (err: any) {
    console.error("Error fetching wallet data:", err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
