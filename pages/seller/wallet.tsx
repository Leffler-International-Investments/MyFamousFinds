// FILE: /pages/seller/wallet.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Security
import { useEffect, useState } from "react";

// You will get this data from the Stripe Connect API
type PayoutRow = {
  id: string;
  date: string;
  amount: string;
  status: string;
  destination: string;
};

type WalletData = {
  available: number;
  upcoming: number;
  lifetime: number;
  payouts: PayoutRow[];
};

export default function SellerWallet() {
  const { loading: authLoading } = useRequireSeller();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    async function loadWallet() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Build an API route at /api/seller/wallet
        // This route will call the Stripe Connect API to get:
        // 1. Account balance (available, pending)
        // 2. List of Payouts (history)
        // 3. Lifetime volume
        
        // For now, we will simulate an empty state
        await new Promise(res => setTimeout(res, 500)); // simulate fetch
        
        // --- THIS IS MOCK DATA ---
        // Replace this with your API call
        const mockData: WalletData = {
          available: 8120.00,
          upcoming: 2430.00,
          lifetime: 142780.00,
          payouts: [
            { id: "po_01", date: "2025-10-28", amount: "$4,320.00", status: "Paid", destination: "Bank •••• 1234" },
            { id: "po_02", date: "2025-10-21", amount: "$2,110.00", status: "Paid", destination: "Bank •••• 1234" },
          ]
        };
        setData(mockData);
        // --- END MOCK DATA ---

      } catch (err: any) {
        setError(err.message || "Failed to load wallet data.");
      } finally {
        setLoading(false);
      }
    }
    
    loadWallet();
  }, [authLoading]);

  const handlePayout = () => {
    alert(
      "This would call the Stripe API to create a Payout from the 'available' balance."
    );
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  return (
    <>
      <Head>
        <title>Seller — Wallet | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <div className="mb-4">
            <Link
              href="/seller/dashboard"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <h1 className="text-2xl font-semibold">Wallet & payouts</h1>
          <p className="mt-1 text-sm text-gray-400">
            Track what you&apos;ve earned and when your money is on the way.
          </p>

          {/* Summary cards */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Available balance</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : `$${(data?.available || 0).toLocaleString("en-US")}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ready to pay out to your bank.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Upcoming payout</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : `$${(data?.upcoming || 0).toLocaleString("en-US")}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Scheduled for Fri, 7 Nov.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Lifetime earnings</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : `$${(data?.lifetime || 0).toLocaleString("en-US")}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Since joining Famous Finds.
              </p>
            </div>
          </section>

          {/* Bank and actions */}
          <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-sm">
              <h2 className="text-sm font-semibold">Connected payout account</h2>
              <p className="mt-2 text-xs text-gray-400">
                Payouts are processed via Stripe and sent to your linked bank.
              </p>
              {/* This part will be dynamic from Stripe Connect */}
              <dl className="mt-4 space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <dt>Bank</dt>
                  <dd>Bendigo Bank</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Account ending</dt>
                  <dd>•••• 1234</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePayout}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Request instant payout
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-xs text-gray-400">
              <h2 className="text-sm font-semibold text-gray-100">
                How payouts work
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Buyer pays Famous Finds at checkout (via Stripe).</li>
                <li>
                  Funds are held until the order is delivered or return window
                  passes.
                </li>
                <li>
                  Net earnings move to your available balance and are
                  paid to your bank on schedule.
                </li>
              </ul>
            </div>
          </section>

          {/* Payout history */}
          <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="mb-3 text-sm font-semibold">Payout history</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Destination</th>
                    <th className="px-3 py-2 text-right">Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        Loading history...
                      </td>
                    </tr>
                  )}
                  {!loading && data?.payouts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{p.date}</td>
                      <td className="px-3 py-2">{p.amount}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{p.destination}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href="/seller/statements"
                          className="text-[11px] text-gray-300 underline-offset-2 hover:underline"
                        >
                          View statement
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
