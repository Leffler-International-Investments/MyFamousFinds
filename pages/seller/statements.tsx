// FILE: /pages/seller/statements.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // --- 1. IMPORT THE HOOK ---

type StatementSummary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  start?: string;
  end?: string;
  summary?: StatementSummary;
};

type PeriodOption = {
  id: string;
  label: string;
  start: string;
  end: string;
};

function buildPeriods(): PeriodOption[] {
  const now = new Date();
  const periods: PeriodOption[] = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${year}-${pad(month + 1)}-${pad(1)}`;
    const endStr = `${year}-${pad(month + 1)}-${pad(end.getDate())}`;
    const label = start.toLocaleDateString("en-US", { // Use en-US
      month: "long",
      year: "numeric",
    });

    periods.push({
      id: `${year}-${pad(month + 1)}`,
      label,
      start: startStr,
      end: endStr,
    });
  }

  return periods;
}

export default function SellerStatements() {
  // --- 2. ADD THE SECURITY HOOK ---
  const { loading: authLoading } = useRequireSeller();
  
  const periods = useMemo(() => buildPeriods(), []);
  const [selectedId, setSelectedId] = useState(periods[0]?.id);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPeriod =
    periods.find((p) => p.id === selectedId) || periods[0];

  useEffect(() => {
    // --- 3. WAIT FOR AUTH CHECK ---
    if (authLoading || !currentPeriod) return;
    
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          start: currentPeriod.start,
          end: currentPeriod.end,
        });
        // You must be logged in for this fetch to work
        const res = await fetch(`/api/seller/statement?${params.toString()}`);
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
  }, [currentPeriod, authLoading]); // <-- 4. ADD AUTHLOADING TO DEPENDENCIES

  const summary = data?.summary;

  const handleDownloadCsv = () => {
    if (!currentPeriod) return;
    const params = new URLSearchParams({
      start: currentPeriod.start,
      end: currentPeriod.end,
      format: "csv",
    });
    window.location.href = `/api/seller/statement?${params.toString()}`;
  };

  // --- 5. RENDER NOTHING WHILE CHECKING AUTH ---
  if (authLoading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Seller — Statements | Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <Link
          href="/seller/dashboard"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          ← Back to seller dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Payout statements
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Export-ready view of orders, fees and refunds for your
              accountant or bookkeeper.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs outline-none hover:border-neutral-500"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
            >
              Download CSV
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          {loading && (
            <p className="text-xs text-gray-400">Loading statement…</p>
          )}

          {!loading && data && !data.ok && (
            <p className="text-xs text-red-400">
              {data.error || "We couldn&apos;t load this statement."}
            </Note: This will show the "DECODER routines" error if your Vercel key is wrong.
            </p>
          )}

          {!loading && data?.ok && summary && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Period
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {summary.period.start} – {summary.period.end}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Orders
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {summary.totals.sold}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {summary.totals.refunded} refunded
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Gross sales
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    $
                    {summary.money.gross.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Fees $
                    {summary.money.fees.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Net payout
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">
                    $
                    {summary.money.net.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {summary.money.refunds > 0 && (
                    <p className="text-[11px] text-gray-400">
                      Includes refunds of $
                      {summary.money.refunds.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-5 text-[11px] text-gray-500">
                Use the CSV export for your own accounting or to reconcile
                payouts in Stripe or your bank account. For a PDF-friendly
                layout, use the “Print-friendly statement” link.
              </p>

              <div className="mt-6">
                <Link
                  href={`/seller/statement-print?start=${summary.period.start}&end=${summary.period.end}`}
                  className="text-[11px] text-gray-300 underline-offset-2 hover:underline"
                >
                  Open print-friendly statement
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
