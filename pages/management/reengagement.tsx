// FILE: /pages/management/reengagement.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ReengagementPage() {
  const { loading } = useRequireAdmin();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function runCampaign() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/reengagement", {
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
        <title>Re-engagement Campaigns — Management</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Re-engagement Campaigns</h1>
              <p>
                Send consignment invitations to past buyers (6–12 months ago).
                "Ready to consign that red dress?" messaging via email.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="action-card">
            <h2>Run Re-engagement Campaign</h2>
            <p className="action-description">
              This scans orders from 6–12 months ago and sends personalized
              consignment invitation emails to past buyers. Buyers who already
              received a re-engagement email in the last 30 days will be skipped.
            </p>
            <div className="campaign-info">
              <p><strong>Target window:</strong> Buyers who purchased 6–12 months ago</p>
              <p><strong>Cooldown:</strong> 30 days between emails per buyer</p>
              <p><strong>Message:</strong> Personalized with their purchased item and brand</p>
            </div>
            <button
              className="btn-run"
              onClick={runCampaign}
              disabled={running}
            >
              {running ? "Running campaign…" : "Send Re-engagement Emails"}
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
              <p>Targets found: <strong>{result.targetsFound || 0}</strong></p>
              <p>Emails sent: <strong>{result.emailsSent || 0}</strong></p>
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
          margin: 0 0 16px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .campaign-info {
          background: #fffbeb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #92400e;
        }
        .campaign-info p { margin: 4px 0; }
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
