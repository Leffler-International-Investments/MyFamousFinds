// FILE: /pages/seller/statement-print.tsx
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type StatementSummary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

type StatementRow = {
  date: string;
  sku: string;
  title: string;
  action: string;
  qty: number;
  gross: number;
  fee: number;
  net: number;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  summary?: StatementSummary;
  rows?: StatementRow[];
};

export default function SellerStatementPrint() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeof router.query.start === "string") {
          params.set("start", router.query.start);
        }
        if (typeof router.query.end === "string") {
          params.set("end", router.query.end);
        }
        const qs = params.toString();
        const res = await fetch(
          qs ? `/api/seller/statement?${qs}` : "/api/seller/statement"
        );
        const json: ApiResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setData({ ok: false, error: "Failed to load statement." });
      } finally {
        if (!cancelled) setLoading(false);
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
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
          >
            Print
          </button>
        </div>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          {loading && (
            <p className="text-xs text-gray-400">Loading statement…</p>
          )}

          {!loading && data && !data.ok && (
            <p className="text-xs text-red-400">
              {data.error || "We couldn&apos;t load this statement."}
            </p>
          )}

          {!loading && data?.ok && summary && (
            <>
              <div className="grid gap-4 border-b border-neutral-800 pb-4 text-xs md:grid-cols-3">
                <div>
                  <h2 className="mb-1 font-semibold text-gray-200">Period</h2>
                  <p>
                    {summary.period.start} – {summary.period.end}
                  </p>
                </div>
                <div>
                  <h2 className="mb-1 font-semibold text-gray-200">Seller</h2>
                  <p>Seller account</p>
                  <p className="text-[11px] text-gray-400">
                    Based on your logged-in account
                  </p>
                </div>
                <div>
                  <h2 className="mb-1 font-semibold text-gray-200">Summary</h2>
                  <p>
                    Orders: <strong>{summary.totals.sold}</strong>
                  </p>
                  <p>
                    GMV: $
                    {summary.money.gross.toLocaleString("en-AU", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p>
                    Net payout: $
                    {summary.money.net.toLocaleString("en-AU", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs">
                <h2 className="mb-2 font-semibold text-gray-200">
                  Line items
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full text-[11px]">
                    <thead className="border-b border-neutral-800 text-[10px] uppercase tracking-wide text-gray-400">
                      <tr>
                        <th className="py-2 pr-3 text-left">Date</th>
                        <th className="px-3 py-2 text-left">SKU</th>
                        <th className="px-3 py-2 text-left">Title</th>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Gross</th>
                        <th className="px-3 py-2 text-right">Fee</th>
                        <th className="px-3 py-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-neutral-900 last:border-0"
                        >
                          <td className="py-1 pr-3">{r.date}</td>
                          <td className="px-3 py-1">{r.sku}</td>
                          <td className="px-3 py-1">{r.title}</td>
                          <td className="px-3 py-1">{r.action}</td>
                          <td className="px-3 py-1 text-right">{r.qty}</td>
                          <td className="px-3 py-1 text-right">
                            ${r.gross.toFixed(2)}
                          </td>
                          <td className="px-3 py-1 text-right">
                            ${r.fee.toFixed(2)}
                          </td>
                          <td className="px-3 py-1 text-right">
                            ${r.net.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-4 text-center text-gray-400"
                          >
                            No statement rows found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-gray-500">
                This statement is generated directly from your live orders,
                refunds and fees in Famous Finds. Use it together with your
                Stripe payout reports and bank statements for reconciliation.
              </p>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
