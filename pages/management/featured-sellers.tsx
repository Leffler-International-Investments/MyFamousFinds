// FILE: /pages/management/featured-sellers.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type TopSeller = {
  sellerId: string;
  sales: number;
  listings: number;
  score: number;
};

export default function FeaturedSellersPage() {
  const { loading } = useRequireAdmin();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function runUpdate() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/featured-sellers", {
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
        <title>Featured Sellers — Management</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Featured Sellers</h1>
              <p>
                Calculate performance-based seller rankings for homepage
                placement priority. Sellers with 2+ sales/month get featured.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="action-card">
            <h2>Update Seller Rankings</h2>
            <p className="action-description">
              This calculates each seller's performance score based on sales in
              the last 30 days and active listing count. Sellers meeting the
              threshold (2+ sales/month) are marked as featured for homepage
              placement.
            </p>
            <div className="scoring-info">
              <p><strong>Score formula:</strong> (monthly sales x 3) + active listings</p>
              <p><strong>Featured threshold:</strong> 2+ items sold in the last 30 days</p>
            </div>
            <button
              className="btn-run"
              onClick={runUpdate}
              disabled={running}
            >
              {running ? "Calculating rankings…" : "Update Seller Rankings"}
            </button>
          </section>

          {error && (
            <div className="result-card result-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="result-card result-success">
              <h3>Rankings Updated</h3>
              <p>Total sellers scored: <strong>{result.totalSellers || 0}</strong></p>
              <p>Featured sellers: <strong>{result.featuredCount || 0}</strong></p>

              {result.topSellers && result.topSellers.length > 0 && (
                <div className="top-sellers">
                  <h4>Top 10 Sellers</h4>
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Seller ID</th>
                        <th>Sales (30d)</th>
                        <th>Listings</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.topSellers.map((s: TopSeller, i: number) => (
                        <tr key={s.sellerId}>
                          <td>{i + 1}</td>
                          <td className="seller-id">{s.sellerId}</td>
                          <td>{s.sales}</td>
                          <td>{s.listings}</td>
                          <td><strong>{s.score}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        .scoring-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #374151;
        }
        .scoring-info p { margin: 4px 0; }
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
        .top-sellers {
          margin-top: 16px;
        }
        .top-sellers h4 {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
        }
        .rankings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .rankings-table th {
          text-align: left;
          padding: 6px 10px;
          border-bottom: 1px solid #bbf7d0;
          font-weight: 600;
          color: #166534;
        }
        .rankings-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #dcfce7;
        }
        .seller-id {
          font-family: monospace;
          font-size: 12px;
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
