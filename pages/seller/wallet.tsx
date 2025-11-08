// FILE: /pages/seller/wallet.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Security
import { useEffect, useState, useCallback } from "react"; // <-- ADDED useCallback

// Data from your Stripe Connect API
type PayoutRow = {
  id: string;
  date: string;
  amount: string;
  status: string;
  destination: string;
};

// --- ADDED: Type for bank account ---
type BankAccount = {
  bankName: string;
  last4: string;
};

// --- UPDATED: WalletData type ---
type WalletData = {
  available: number;
  upcoming: number;
  lifetime: number;
  payouts: PayoutRow[];
  account: BankAccount | null; // <-- ADDED: To show bank details
  upcomingDate: string | null; // <-- ADDED: To show next payout date
};

export default function SellerWallet() {
  const { loading: authLoading } = useRequireSeller();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ADDED: States for the payout button ---
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // --- UPDATED: loadWallet function ---
  // Wrapped in useCallback so it can be safely called by handlePayout
  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This is now a live API call
      const res = await fetch("/api/seller/wallet");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load wallet data");
      }

      // Set the data from the API
      setData(data.wallet);
      
    } catch (err: any) {
      setError(err.message || "Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, safe to cache

  useEffect(() => {
    if (authLoading) return;
    loadWallet();
  }, [authLoading, loadWallet]);

  // --- UPDATED: handlePayout function ---
  // This is now a live API call
  const handlePayout = async () => {
    setPayoutLoading(true);
    setPayoutError(null);

    try {
      const res = await fetch("/api/seller/wallet/payout", {
        method: "POST",
        // You could add a body here if you need to specify an amount
        // body: JSON.stringify({ amount: data?.available }) 
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Payout request failed");
      }

      // Success!
      alert("Payout successful! Your balance is being updated.");
      // Refresh the wallet data to show the new balance
      await loadWallet();

    } catch (err: any) {
      console.error("Payout error:", err);
      setPayoutError(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  // Helper for formatting
  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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
          
          {error && (
            <div className="mt-4 rounded-md bg-red-900/50 p-3 text-xs text-red-300">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {/* Summary cards */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Available balance</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : formatCurrency(data?.available || 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ready to pay out to your bank.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Upcoming payout</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : formatCurrency(data?.upcoming || 0)}
              </p>
              {/* --- UPDATED: Live Date --- */}
              <p className="mt-1 text-xs text-gray-500">
                {loading ? "..." : (data?.upcomingDate || "No upcoming payouts")}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Lifetime earnings</p>
              <p className="mt-2 text-xl font-semibold">
                {loading ? "..." : formatCurrency(data?.lifetime || 0)}
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
              
              {/* --- UPDATED: Live Bank Details --- */}
              {loading ? (
                <p className="mt-4 text-xs text-gray-400">Loading account...</p>
              ) : data?.account ? (
                <dl className="mt-4 space-y-1 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <dt>Bank</dt>
                    <dd>{data.account.bankName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Account ending</dt>
                    <dd>•••• {data.account.last4}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-xs text-yellow-400">
                  No payout account connected. Please set up your account in Stripe.
                </p>
              )}

              <div className="mt-4 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={handlePayout}
                  // --- UPDATED: Disabled states ---
                  disabled={payoutLoading || loading || !data?.available || data.available <= 0}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100 disabled:opacity-60"
                >
                  {payoutLoading ? "Processing..." : "Request instant payout"}
                </button>
                {/* --- ADDED: Payout error message --- */}
                {payoutError && (
                  <p className="text-xs text-red-400">{payoutError}</p>
                )}
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
                  {!loading && !data?.payouts.length && (
                     <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        No payout history found.
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
                        {/* You could add logic here for different status colors */}
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
