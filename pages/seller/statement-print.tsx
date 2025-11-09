// FILE: /pages/seller/statement-print.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Summary = {
  periodLabel: string;
  orders: number;
  listings: number;
  buyers: number;
  money: { gross: number; fees: number; net: number };
};

type Row = {
  date: string;
  orderId: string;
  item: string;
  buyer: string;
  status: string;
  gross: number;
  fees: number;
  net: number;
};

type ApiResponse =
  | { ok: true; summary: Summary; rows: Row[] }
  | { ok: false; error: string };

export default function SellerStatementPrint() {
  const router = useRouter();
  const [data, setData] = useState<{ summary: Summary; rows: Row[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;
    async function load() {
      try {
        const qs = new URLSearchParams(
          router.query as Record<string, string>
        ).toString();
        const res = await fetch(`/api/seller/statement?${qs}`);
        const json: ApiResponse = await res.json();
        if (!res.ok || !("ok" in json) || !json.ok) {
          throw new Error(
            (json as any)?.error || "Unable to load statement data"
          );
        }
        if (!cancelled) {
          setData({ summary: json.summary, rows: json.rows });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load statement data");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.start, router.query.end]);

  const summary = data?.summary;
  const rows = data?.rows || [];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Statement — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            Seller statement
          </h1>
          <button
            onClick={() => window.print()}
            className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white hover:border-white/60 hover:bg-white/5"
          >
            Print
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        )}

        {summary ? (
          <>
            <section className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Period
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {summary.periodLabel}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Orders
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {summary.orders}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Unique buyers
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {summary.buyers}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  GMV (USD)
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  $
                  {summary.money.gross.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Payout summary (USD)
              </h2>
              <div className="mt-3 grid gap-4 text-xs text-gray-200 md:grid-cols-3">
                <p>
                  Gross sales: $
                  {summary.money.gross.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p>
                  Fees and charges: -$
                  {summary.money.fees.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p>
                  Net payout: $
                  {summary.money.net.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                All amounts are in US Dollars (USD). This statement is provided
                for your records and is not tax advice.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5">
              <table className="min-w-full text-left text-xs text-gray-100">
                <thead className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Order ID</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Buyer</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Gross (USD)</th>
                    <th className="px-3 py-2 text-right">Fees (USD)</th>
                    <th className="px-3 py-2 text-right">Net (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.orderId + row.date}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-3 py-2 text-gray-300">{row.date}</td>
                      <td className="px-3 py-2 text-gray-300">
                        {row.orderId}
                      </td>
                      <td className="px-3 py-2 text-gray-100">{row.item}</td>
                      <td className="px-3 py-2 text-gray-300">{row.buyer}</td>
                      <td className="px-3 py-2 text-gray-300">
                        {row.status}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-100">
                        $
                        {row.gross.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-100">
                        -$
                        {row.fees.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-100">
                        $
                        {row.net.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-gray-400"
                      >
                        No transactions in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        ) : !error ? (
          <p className="mt-6 text-xs text-gray-400">
            Loading statement data…
          </p>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
