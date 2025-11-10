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
    const label = start.toLocaleDateString("en-US", {
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
    return <div className="dark-theme-page"></div>;
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Seller — Statements | Famous Finds</title>
      </Head>
      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/seller/dashboard">← Back to seller dashboard</Link>
        </div>

        <div className="page-header">
          <div>
            <h1>Payout statements</h1>
            <p className="subtitle">
              Export-ready view of orders, fees and refunds for your
              accountant or bookkeeper.
            </p>
          </div>
          <div className="header-actions">
            <select
              className="select-filter"
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
              className="btn-secondary"
            >
              Download CSV
            </button>
          </div>
        </div>

        <section className="card">
          {loading && <p className="card-message">Loading statement…</p>}

          {!loading && data && !data.ok && (
            <p className="card-message error">
              {data.error || "We couldn&apos;t load this statement."}
              <br />
              <br />
              (If you see a DECODER error, your Vercel private key is formatted
              incorrectly. You must re-paste it and{" "}
              <strong>wrap it in double quotes</strong>.)
            </p>
          )}

          {!loading && data?.ok && summary && (
            <>
              <div className="summary-grid">
                <div className="summary-item">
                  <p className="summary-label">Period</p>
                  <p className="summary-value">
                    {summary.period.start} – {summary.period.end}
                  </p>
                </div>
                <div className="summary-item">
                  <p className="summary-label">Orders</p>
                  <p className="summary-value">{summary.totals.sold}</p>
                  <p className="summary-note">
                    {summary.totals.refunded} refunded
                  </p>
                </div>
                <div className="summary-item">
                  <p className="summary-label">Gross sales</p>
                  <p className="summary-value">
                    $
                    {summary.money.gross.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="summary-note">
                    Fees $
                    {summary.money.fees.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="summary-item">
                  <p className="summary-label">Net payout</p>
                  <p className="summary-value net">
                    $
                    {summary.money.net.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {summary.money.refunds > 0 && (
                    <p className="summary-note">
                      Includes refunds of $
                      {summary.money.refunds.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <p className="footer-note">
                Use the CSV export for your own accounting or to reconcile
                payouts in Stripe or your bank account. For a PDF-friendly
                layout, use the “Print-friendly statement” link.
              </p>

              <div className="footer-link">
                <Link
                  href={`/seller/statement-print?start=${summary.period.start}&end=${summary.period.end}`}
                  className="table-link"
                >
                  Open print-friendly statement
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .back-link a:hover {
          color: #e5e7eb; /* gray-200 */
        }

        .page-header {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        
        .header-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .select-filter {
          border-radius: 999px;
          border: 1px solid #374151; /* neutral-700 */
          background: #030712; /* neutral-950 */
          padding: 4px 12px;
          font-size: 12px;
          color: #e5e7eb;
          outline: none;
        }
        .select-filter:hover {
          border-color: #6b7280; /* neutral-500 */
        }
        
        .btn-secondary {
          border-radius: 999px;
          border: 1px solid #374151; /* neutral-700 */
          padding: 4px 12px;
          font-size: 12px;
          color: #e5e7eb;
          text-decoration: none;
          background: transparent;
        }
        .btn-secondary:hover {
          border-color: #6b7280; /* neutral-500 */
        }
        
        .card {
          margin-top: 24px;
          border-radius: 12px;
          border: 1px solid #1f2937; /* neutral-800 */
          background: #030712; /* neutral-950 */
          padding: 20px;
        }
        
        .card-message {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .card-message.error {
          color: #f87171; /* red-400 */
          line-height: 1.5;
        }
        
        .summary-grid {
          display: grid;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .summary-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af; /* gray-400 */
        }
        .summary-value {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 500;
          color: white;
        }
        .summary-value.net {
          font-size: 18px;
          font-weight: 600;
          color: #6ee7b7; /* emerald-300 */
        }
        .summary-note {
          font-size: 11px;
          color: #9ca3af; /* gray-400 */
        }
        
        .footer-note {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #1f2937; /* neutral-800 */
          font-size: 11px;
          color: #6b7280; /* gray-500 */
        }
        .footer-link {
          margin-top: 24px;
        }
        .table-link {
          font-size: 11px;
          color: #d1d5db; /* gray-300 */
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .table-link:hover {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
