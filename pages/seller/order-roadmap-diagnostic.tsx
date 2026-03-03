import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Stage = {
  key: string;
  title: string;
  status: "complete" | "active" | "pending" | "warning" | "error";
  timestamp?: string | null;
  details?: string;
};

type RoadmapResult = {
  ok: true;
  order: {
    id: string;
    status?: string;
    buyerName?: string;
    buyerEmail?: string;
    sellerId?: string;
    listingTitle?: string;
    total?: number;
    currency?: string;
  };
  stages: Stage[];
  coolingDays: number;
  payoutMode: string;
  recommendations: string[];
};

export default function OrderRoadmapDiagnosticPage() {
  const { loading: authLoading } = useRequireAdmin();
  const router = useRouter();

  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoadmapResult | null>(null);

  useEffect(() => {
    const q = router.query?.orderId;
    if (typeof q === "string" && q.trim()) {
      setOrderId(q.trim());
    }
  }, [router.query?.orderId]);

  async function runDiagnostic() {
    const id = orderId.trim();
    if (!id) {
      setError("Please enter an order ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/orders/roadmap-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to run diagnostic");
      }

      setResult(json as RoadmapResult);
    } catch (e: any) {
      setError(e?.message || "Failed to run diagnostic");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId && !result && !loading && !error && !authLoading) {
      runDiagnostic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, authLoading]);

  if (authLoading) return <div className="dashboard-page" />;

  const stages = result?.stages || [];
  const completeCount = stages.filter((s) => s.status === "complete").length;
  const activeCount = stages.filter((s) => s.status === "active").length;
  const warningCount = stages.filter(
    (s) => s.status === "warning" || s.status === "error"
  ).length;
  const pendingCount = stages.filter((s) => s.status === "pending").length;

  function statusIcon(s: Stage["status"]) {
    if (s === "complete") return "\u2705";
    if (s === "active") return "\u23F3";
    if (s === "warning") return "\u26A0\uFE0F";
    if (s === "error") return "\u274C";
    return "\u25CB";
  }

  function statusLabel(s: Stage["status"]) {
    if (s === "complete") return "Done";
    if (s === "active") return "In Progress";
    if (s === "warning") return "Needs Attention";
    if (s === "error") return "Failed";
    return "Pending";
  }

  function money(amount?: number, currency?: string) {
    const c = (currency || "USD").toUpperCase();
    const n = Number(amount || 0);
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: c,
      }).format(n);
    } catch {
      return `${c} ${n.toFixed(2)}`;
    }
  }

  return (
    <>
      <Head>
        <title>Order Roadmap Diagnostic | Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="page-wrap">
          <div className="back-link">
            <Link href="/management/dashboard">
              &larr; Back to Management Dashboard
            </Link>
          </div>

          <section className="card">
            <h1>Order Roadmap Diagnostic</h1>
            <p className="muted">
              Enter an Order ID to see the full lifecycle status: order placed
              &rarr; UPS label &rarr; picked up &rarr; delivered &rarr; signature
              confirmed &rarr; cooling period &rarr; payment activated.
            </p>

            <div className="row">
              <input
                className="input"
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runDiagnostic();
                }}
              />
              <button
                className="btn btn-primary"
                onClick={runDiagnostic}
                disabled={loading}
              >
                {loading ? "Running\u2026" : "Run Diagnostic"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}
          </section>

          {result && (
            <>
              {/* Order summary */}
              <section className="card">
                <h2>Order Summary</h2>
                <div className="chips">
                  <span className="chip ok">DONE {completeCount}</span>
                  {activeCount > 0 && (
                    <span className="chip active">ACTIVE {activeCount}</span>
                  )}
                  {warningCount > 0 && (
                    <span className="chip warn">
                      ATTENTION {warningCount}
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="chip pending">
                      PENDING {pendingCount}
                    </span>
                  )}
                </div>

                <div className="meta-grid">
                  <div>
                    <strong>Order ID:</strong> {result.order.id}
                  </div>
                  <div>
                    <strong>Status:</strong> {result.order.status || "-"}
                  </div>
                  <div>
                    <strong>Listing:</strong>{" "}
                    {result.order.listingTitle || "-"}
                  </div>
                  <div>
                    <strong>Buyer:</strong>{" "}
                    {result.order.buyerName || "-"} (
                    {result.order.buyerEmail || "-"})
                  </div>
                  <div>
                    <strong>Seller ID:</strong>{" "}
                    {result.order.sellerId || "-"}
                  </div>
                  <div>
                    <strong>Total:</strong>{" "}
                    {money(result.order.total, result.order.currency)}
                  </div>
                  <div>
                    <strong>Cooling Days:</strong> {result.coolingDays}
                  </div>
                  <div>
                    <strong>Payout Mode:</strong> {result.payoutMode}
                  </div>
                </div>
              </section>

              {/* Roadmap timeline */}
              <section className="card">
                <h2>Roadmap Timeline</h2>
                <div className="timeline">
                  {stages.map((s, i) => (
                    <div key={s.key} className={`tl-step ${s.status}`}>
                      <div className="tl-line-area">
                        <div
                          className={`tl-dot ${s.status}`}
                          title={statusLabel(s.status)}
                        >
                          {statusIcon(s.status)}
                        </div>
                        {i < stages.length - 1 && (
                          <div
                            className={`tl-connector ${
                              s.status === "complete" ? "done" : ""
                            }`}
                          />
                        )}
                      </div>
                      <div className="tl-body">
                        <div className="tl-header">
                          <span className="tl-title">{s.title}</span>
                          <span className={`tl-badge ${s.status}`}>
                            {statusLabel(s.status)}
                          </span>
                        </div>
                        {s.details && (
                          <div className="tl-details">{s.details}</div>
                        )}
                        {s.timestamp && (
                          <div className="tl-time">
                            {new Date(s.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommendations */}
              <section className="card">
                <h2>Recommendations</h2>
                {result.recommendations.length === 0 ? (
                  <p className="muted">
                    All stages are progressing normally. No action needed.
                  </p>
                ) : (
                  <ul>
                    {result.recommendations.map((r, i) => (
                      <li key={`${i}-${r.slice(0, 20)}`}>{r}</li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f5f5f4;
        }
        .page-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }
        .back-link {
          margin-bottom: 12px;
        }
        .back-link a {
          font-size: 12px;
          color: #6b7280;
          text-decoration: none;
        }
        .back-link a:hover {
          color: #111827;
        }
        .card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 14px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }
        h2 {
          margin: 0 0 14px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .muted {
          color: #57534e;
          font-size: 13px;
          line-height: 1.4;
        }
        .row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .input {
          flex: 1;
          height: 42px;
          border: 1px solid #d6d3d1;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 15px;
        }
        .input:focus {
          outline: none;
          border-color: #9ca3af;
        }
        .btn {
          border: none;
          border-radius: 8px;
          height: 42px;
          padding: 0 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .btn-primary {
          background: #1c1917;
          color: #fff;
        }
        .btn-primary:hover {
          background: #000;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error {
          margin-top: 10px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
        }

        /* Chips */
        .chips {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .chip {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
        }
        .chip.ok {
          background: #ecfdf5;
          color: #065f46;
        }
        .chip.active {
          background: #eff6ff;
          color: #1e40af;
        }
        .chip.warn {
          background: #fffbeb;
          color: #92400e;
        }
        .chip.pending {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* Meta grid */
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px;
          font-size: 13px;
        }

        /* Timeline */
        .timeline {
          display: flex;
          flex-direction: column;
        }
        .tl-step {
          display: flex;
          gap: 14px;
          min-height: 72px;
        }
        .tl-line-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 32px;
          flex-shrink: 0;
        }
        .tl-dot {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .tl-connector {
          width: 2px;
          flex: 1;
          background: #d6d3d1;
          min-height: 20px;
        }
        .tl-connector.done {
          background: #34d399;
        }
        .tl-body {
          flex: 1;
          padding-bottom: 16px;
        }
        .tl-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .tl-title {
          font-weight: 700;
          font-size: 14px;
          color: #111827;
        }
        .tl-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }
        .tl-badge.complete {
          background: #ecfdf5;
          color: #065f46;
        }
        .tl-badge.active {
          background: #eff6ff;
          color: #1e40af;
        }
        .tl-badge.warning,
        .tl-badge.error {
          background: #fef2f2;
          color: #991b1b;
        }
        .tl-badge.pending {
          background: #f3f4f6;
          color: #6b7280;
        }
        .tl-details {
          font-size: 13px;
          color: #44403c;
          line-height: 1.4;
        }
        .tl-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* Recommendations */
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          font-size: 13px;
          color: #374151;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .row {
            flex-direction: column;
          }
          .input {
            width: 100%;
          }
          h1 {
            font-size: 22px;
          }
          .meta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
