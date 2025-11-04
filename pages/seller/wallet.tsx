// FILE: /pages/seller/wallet.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const payouts = [
  { id: "po_01", date: "2025-10-28", amount: "$4,320.00", status: "Paid", destination: "Bank •••• 1234" },
  { id: "po_02", date: "2025-10-21", amount: "$2,110.00", status: "Paid", destination: "Bank •••• 1234" },
  { id: "po_03", date: "2025-10-14", amount: "$3,870.00", status: "Paid", destination: "Bank •••• 1234" },
  { id: "po_04", date: "2025-10-07", amount: "$1,540.00", status: "Paid", destination: "Bank •••• 1234" },
];

export default function SellerWallet() {
  const handlePayout = () => {
    alert(
      "In a full build, this would create a payout via Stripe to the connected bank account."
    );
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
              href="/"
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
              <p className="mt-2 text-xl font-semibold">$8,120.00</p>
              <p className="mt-1 text-xs text-gray-500">
                Ready to pay out to your bank.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Upcoming payout</p>
              <p className="mt-2 text-xl font-semibold">$2,430.00</p>
              <p className="mt-1 text-xs text-gray-500">
                Scheduled for Fri, 7 Nov.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs text-gray-400">Lifetime earnings</p>
              <p className="mt-2 text-xl font-semibold">$142,780.00</p>
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
              <dl className="mt-4 space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <dt>Bank</dt>
                  <dd>Bendigo Bank</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Account ending</dt>
                  <dd>•••• 1234</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Account holder</dt>
                  <dd>Famous Finds Seller</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Settlement schedule</dt>
                  <dd>Weekly, every Friday</dd>
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
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "In a full build this would open a form in Stripe to update bank details."
                    )
                  }
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                >
                  Update bank details
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
                  Net earnings (minus fees) move to your available balance and
                  are paid to your bank on the schedule above.
                </li>
              </ul>
              <p className="mt-3">
                In production we would show a line-by-line breakdown for each
                order, including fees, tax and adjustments.
              </p>
            </div>
          </section>

          {/* Payout history */}
          <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-sm font-semibold">Payout history</h2>
              <button
                type="button"
                onClick={() =>
                  alert("Would export payout history as CSV or PDF.")
                }
                className="self-start rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
              >
                Export history
              </button>
            </div>

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
                  {payouts.map((p) => (
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
