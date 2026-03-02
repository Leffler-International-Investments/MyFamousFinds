import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

type Check = {
  key: string;
  title: string;
  ok: boolean;
  details?: string;
  severity?: "error" | "warning";
};

type OutboxRow = {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  lastError?: string;
  to?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type DiagnosticsResponse = {
  ok: true;
  checks: Check[];
  recommendations: string[];
  order: {
    id: string;
    status?: string;
    sellerId?: string;
    buyerEmail?: string;
    shippingLabelStatus?: string;
    shippingTrackingNumber?: string;
    shippingLabelUrl?: string;
    shippingLabelError?: string;
  };
  outbox: OutboxRow[];
};

export default function SellerUpsDiagnosticsPage() {
  const { loading: authLoading } = useRequireSeller();
  const router = useRouter();

  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticsResponse | null>(null);

  useEffect(() => {
    const q = router.query?.orderId;
    if (typeof q === "string" && q.trim()) {
      setOrderId(q.trim());
    }
  }, [router.query?.orderId]);

  async function runDiagnostics() {
    const id = orderId.trim();
    if (!id) {
      setError("Please enter an order ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await sellerFetch("/api/ups/order-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to run diagnostics");
      }

      setResult(json as DiagnosticsResponse);
    } catch (e: any) {
      setError(e?.message || "Failed to run diagnostics");
    } finally {
      setLoading(false);
    }
  }

  // Auto-run if orderId came from query
  useEffect(() => {
    if (orderId && !result && !loading && !error && !authLoading) {
      runDiagnostics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, authLoading]);

  if (authLoading) return <div className="dashboard-page" />;

  const checks = result?.checks || [];
  const passCount = checks.filter((c) => c.ok).length;
  const failCount = checks.filter((c) => !c.ok && c.severity !== "warning").length;
  const warnCount = checks.filter((c) => !c.ok && c.severity === "warning").length;

  return (
    <>
      <Head>
        <title>UPS Label Diagnostics | Seller</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="page-wrap">
          <div className="back-link">
            <Link href="/seller/orders">← Back to Orders</Link>
          </div>

          <section className="card">
            <h1>UPS Label Diagnostics</h1>
            <p className="muted">
              Enter an Order ID to diagnose why a UPS label or label email may not have been delivered.
              This checks environment variables, Firebase, seller address, order state, UPS API, and email delivery.
            </p>

            <div className="row">
              <input
                className="input"
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runDiagnostics();
                }}
              />
              <button className="btn btn-primary" onClick={runDiagnostics} disabled={loading}>
                {loading ? "Running…" : "Run Diagnostics"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}
          </section>

          {result && (
            <>
              <section className="card">
                <h2>Summary</h2>
                <div className="chips">
                  <span className="chip ok">PASS {passCount}</span>
                  <span className="chip fail">FAIL {failCount}</span>
                  <span className="chip warn">WARN {warnCount}</span>
                </div>

                <div className="meta-grid">
                  <div><strong>Order ID:</strong> {result.order.id}</div>
                  <div><strong>Status:</strong> {result.order.status || "-"}</div>
                  <div><strong>Label Status:</strong> {result.order.shippingLabelStatus || "-"}</div>
                  <div><strong>Tracking #:</strong> {result.order.shippingTrackingNumber || "-"}</div>
                  <div><strong>Buyer Email:</strong> {result.order.buyerEmail || "-"}</div>
                  <div>
                    <strong>Label URL:</strong>{" "}
                    {result.order.shippingLabelUrl ? (
                      <a href={result.order.shippingLabelUrl} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                {result.order.shippingLabelError && (
                  <div className="error" style={{ marginTop: 12 }}>
                    Latest Label Error: {result.order.shippingLabelError}
                  </div>
                )}
              </section>

              <section className="card">
                <h2>Checks</h2>
                <div className="checks">
                  {checks.map((c) => (
                    <div key={c.key} className={`check ${c.ok ? "ok" : c.severity === "warning" ? "warn" : "fail"}`}>
                      <div className="title">{c.ok ? "\u2705" : c.severity === "warning" ? "\u26A0\uFE0F" : "\u274C"} {c.title}</div>
                      {c.details && <div className="details">{c.details}</div>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2>Recommendations</h2>
                {result.recommendations.length === 0 ? (
                  <p className="muted">No issues found.</p>
                ) : (
                  <ul>
                    {result.recommendations.map((r, i) => (
                      <li key={`${i}-${r.slice(0, 20)}`}>{r}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card">
                <h2>Email Outbox Events (Order)</h2>
                {result.outbox.length === 0 ? (
                  <p className="muted">No related outbox events found for this order.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Status</th>
                          <th>Attempts</th>
                          <th>To</th>
                          <th>Last Error</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.outbox.map((e) => (
                          <tr key={e.id}>
                            <td>{e.eventType || "-"}</td>
                            <td>
                              <span className={`status-pill ${e.status === "sent" ? "sent" : e.status === "dead" || e.status === "failed" ? "failed" : "pending"}`}>
                                {e.status || "-"}
                              </span>
                            </td>
                            <td>{e.attempts}</td>
                            <td>{e.to || "-"}</td>
                            <td className="error-cell">{e.lastError || "-"}</td>
                            <td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .dashboard-page { min-height: 100vh; background: #f5f5f4; }
        .page-wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 40px; }
        .back-link { margin-bottom: 12px; }
        .back-link a { font-size: 12px; color: #6b7280; text-decoration: none; }
        .back-link a:hover { color: #111827; }
        .card { background: #fff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin-bottom: 14px; }
        h1 { margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #111827; }
        h2 { margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #111827; }
        .muted { color: #57534e; font-size: 13px; line-height: 1.4; }
        .row { display: flex; gap: 10px; margin-top: 14px; }
        .input { flex: 1; height: 42px; border: 1px solid #d6d3d1; border-radius: 8px; padding: 0 12px; font-size: 15px; }
        .input:focus { outline: none; border-color: #9ca3af; }
        .btn { border: none; border-radius: 8px; height: 42px; padding: 0 16px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .btn-primary { background: #1c1917; color: #fff; }
        .btn-primary:hover { background: #000; }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .error { margin-top: 10px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; font-size: 13px; }
        .chips { display: flex; gap: 8px; margin-bottom: 14px; }
        .chip { border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700; }
        .chip.ok { background: #ecfdf5; color: #065f46; }
        .chip.fail { background: #fef2f2; color: #991b1b; }
        .chip.warn { background: #fffbeb; color: #92400e; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; font-size: 13px; }
        .checks { display: grid; gap: 8px; }
        .check { border: 1px solid #e7e5e4; border-radius: 10px; padding: 10px 12px; }
        .check.ok { background: #f0fdf4; border-color: #bbf7d0; }
        .check.warn { background: #fffbeb; border-color: #fde68a; }
        .check.fail { background: #fef2f2; border-color: #fecaca; }
        .title { font-weight: 700; margin-bottom: 4px; font-size: 13px; }
        .details { color: #44403c; font-size: 12px; line-height: 1.4; word-break: break-word; }
        .table-wrap { overflow: auto; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border-bottom: 1px solid #e7e5e4; text-align: left; padding: 8px; font-size: 12px; }
        .table th { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 500; }
        .error-cell { color: #b91c1c; font-size: 11px; max-width: 220px; word-break: break-word; }
        .status-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .status-pill.sent { background: #ecfdf5; color: #065f46; }
        .status-pill.failed { background: #fef2f2; color: #991b1b; }
        .status-pill.pending { background: #fffbeb; color: #92400e; }
        ul { margin: 0; padding-left: 20px; }
        li { font-size: 13px; color: #374151; margin-bottom: 6px; line-height: 1.4; }

        @media (max-width: 640px) {
          .row { flex-direction: column; }
          .input { width: 100%; }
          h1 { font-size: 22px; }
          .meta-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
