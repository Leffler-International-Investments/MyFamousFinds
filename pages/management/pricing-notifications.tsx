// FILE: /pages/management/pricing-notifications.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function PricingNotificationsPage() {
  const { loading } = useRequireAdmin();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function runNotifications() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/pricing-notifications", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Pricing Notifications — Management</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Pricing Notifications</h1>
              <p>
                Send market-based pricing suggestions to sellers whose items have
                had no views after 7 days. Suggests 5% and 10% price reductions.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="action-card">
            <h2>Run Pricing Notification Campaign</h2>
            <p className="action-description">
              This will scan all live listings older than 7 days with zero views,
              and email each seller a personalized pricing suggestion. Sellers who
              were already notified in the last 7 days will be skipped.
            </p>
            <button
              className="btn-run"
              onClick={runNotifications}
              disabled={running}
            >
              {running ? "Sending notifications…" : "Send Pricing Notifications"}
            </button>
          </section>

          {error && (
            <div className="result-card result-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="result-card result-success">
              <h3>Campaign Complete</h3>
              <p>Notifications sent: <strong>{result.notificationsSent || 0}</strong></p>
              {result.errors && result.errors.length > 0 && (
                <div className="result-errors">
                  <p>Some emails failed:</p>
                  <ul>
                    {result.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .action-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .action-card h2 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
        }
        .action-description {
          margin: 0 0 20px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .btn-run {
          display: inline-flex;
          align-items: center;
          padding: 12px 28px;
          border-radius: 999px;
          border: none;
          background: #111827;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-run:hover { opacity: 0.85; }
        .btn-run:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .result-card {
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .result-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .result-success h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }
        .result-success p { margin: 4px 0; }
        .result-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .result-errors {
          margin-top: 12px;
          font-size: 13px;
        }
        .result-errors ul {
          margin: 4px 0 0;
          padding-left: 18px;
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
