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
    
    // --- MOCK DATA FOR DEVELOPMENT ---
    const mockWalletData: WalletData = {
      available: 8120.00,
      upcoming: 2430.00,
      lifetime: 142780.00,
      account: {
        bankName: "Stripe Test Bank",
        last4: "6789",
      },
      upcomingDate: "Scheduled for Nov 14, 2025",
      payouts: [
        { 
          id: "po_123", 
          date: "Nov 02, 2025", 
          amount: "$4,320.00", 
          status: "Paid", 
          destination: "Bank •••• 6789" 
        },
        { 
          id: "po_456", 
          date: "Oct 28, 2025", 
          amount: "$2,110.00", 
          status: "Paid", 
          destination: "Bank •••• 6789" 
        },
      ],
    };
    // --- END MOCK DATA ---

    // When live, you will build this object from your Stripe responses
    res.status(200).json({ ok: true, wallet: mockWalletData });

  } catch (err: any) {
    console.error("Error fetching wallet data:", err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
