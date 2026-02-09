// FILE: /pages/seller/wallet.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Security
import { sellerFetch } from "../../utils/sellerClient";
import { useEffect, useState, useCallback } from "react";

// Data from your Stripe Connect API
type PayoutRow = {
  id: string;
  date: string;
  amount: string;
  status: string;
  destination: string;
};

type BankAccount = {
  bankName: string;
  last4: string;
};

type WalletData = {
  available: number;
  upcoming: number;
  lifetime: number;
  payouts: PayoutRow[];
  account: BankAccount | null;
  upcomingDate: string | null;
};

export default function SellerWallet() {
  const { loading: authLoading } = useRequireSeller();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sellerFetch("/api/seller/wallet");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load wallet data");
      }
      setData(data.wallet);
    } catch (err: any) {
      setError(err.message || "Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadWallet();
  }, [authLoading, loadWallet]);

  const handlePayout = async () => {
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const res = await sellerFetch("/api/seller/wallet/payout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Payout request failed");
      }
      alert("Payout successful! Your balance is being updated.");
      await loadWallet();
    } catch (err: any) {
      console.error("Payout error:", err);
      setPayoutError(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <>
      <Head>
        <title>Seller — Wallet | Famous Finds</title>
      </Head>
      <div className="dark-theme-page">
        <Header />
        <main className="section">
          <div className="back-link">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <h1>Wallet & payouts</h1>
          <p className="subtitle">
            Track what you&apos;ve earned and when your money is on the way.
          </p>

          {error && (
            <div className="banner error">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Summary cards */}
          <section className="metrics-grid">
            <div className="metric-card">
              <p className="metric-label">Available balance</p>
              <p className="metric-value">
                {loading ? "..." : formatCurrency(data?.available || 0)}
              </p>
              <p className="metric-note">Ready to pay out to your bank.</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Upcoming payout</p>
              <p className="metric-value">
                {loading ? "..." : formatCurrency(data?.upcoming || 0)}
              </p>
              <p className="metric-note">
                {loading
                  ? "..."
                  : data?.upcomingDate || "No upcoming payouts"}
              </p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Lifetime earnings</p>
              <p className="metric-value">
                {loading ? "..." : formatCurrency(data?.lifetime || 0)}
              </p>
              <p className="metric-note">Since joining Famous Finds.</p>
            </div>
          </section>

          {/* Bank and actions */}
          <section className="info-grid">
            <div className="info-card">
              <h2>Connected payout account</h2>
              <p className="info-note">
                Payouts are processed via Stripe and sent to your linked bank.
              </p>

              {loading ? (
                <p className="bank-loading">Loading account...</p>
              ) : data?.account ? (
                <dl className="bank-details">
                  <div className="detail-row">
                    <dt>Bank</dt>
                    <dd>{data.account.bankName}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Account ending</dt>
                    <dd>•••• {data.account.last4}</dd>
                  </div>
                </dl>
              ) : (
                <p className="bank-warning">
                  No payout account connected. Please set up your account in
                  Stripe.
                </p>
              )}

              <div className="payout-action">
                <button
                  type="button"
                  onClick={handlePayout}
                  disabled={
                    payoutLoading ||
                    loading ||
                    !data?.available ||
                    data.available <= 0
                  }
                  className="btn-primary"
                >
                  {payoutLoading ? "Processing..." : "Request instant payout"}
                </button>
                {payoutError && (
                  <p className="banner error">{payoutError}</p>
                )}
              </div>
            </div>

            <div className="info-card">
              <h2>How payouts work</h2>
              <ul className="info-list">
                <li>Buyer pays Famous Finds at checkout (via Stripe).</li>
                <li>
                  Funds are held until the order is delivered or return window
                  passes.
                </li>
                <li>
                  Net earnings move to your available balance and are
                  paid to your bank on schedule.
                </li>
              </ul>
            </div>
          </section>

          {/* Payout history (using sell-card style from catalogue) */}
          <section className="sell-card" style={{ marginTop: "40px" }}>
            <h2>Payout history</h2>
            <div className="table-overflow-wrapper">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Destination</th>
                    <th style={{ textAlign: "right" }}>Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="table-message">
                        Loading history...
                      </td>
                    </tr>
                  )}
                  {!loading && !data?.payouts.length && (
                    <tr>
                      <td colSpan={5} className="table-message">
                        No payout history found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data?.payouts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.date}</td>
                        <td>{p.amount}</td>
                        <td>
                          <span className="status-badge status-paid">
                            {p.status}
                          </span>
                        </td>
                        <td>{p.destination}</td>
                        <td style={{ textAlign: "right" }}>
                          <Link href="/seller/statements" className="table-link">
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

      <style jsx>{`
        .back-link {
          margin-bottom: 16px;
        }
        .back-link a {
          font-size: 14px;
          color: #9ca3af; /* gray-400 */
        }
        .back-link a:hover {
          color: #e5e7eb; /* gray-200 */
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #9ca3af; /* gray-400 */
        }
        
        .banner {
          margin-top: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .banner.error {
          background: #7f1d1d; /* red-900 */
          color: #fee2e2; /* red-100 */
        }
        
        .metrics-grid {
          margin-top: 24px;
          display: grid;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .metric-card {
          border-radius: 12px;
          border: 1px solid #1f2937; /* neutral-800 */
          background: #030712; /* neutral-950 */
          padding: 16px;
        }
        .metric-label {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .metric-value {
          margin-top: 8px;
          font-size: 20px;
          font-weight: 600;
        }
        .metric-note {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
        
        .info-grid {
          margin-top: 32px;
          display: grid;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .info-grid {
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.2fr);
          }
        }
        
        .info-card {
          border-radius: 12px;
          border: 1px solid #1f2937; /* neutral-800 */
          background: #030712; /* neutral-950 */
          padding: 20px;
        }
        .info-card h2 {
          font-size: 14px;
          font-weight: 600;
        }
        .info-note {
          margin-top: 8px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .info-list {
          margin-top: 8px;
          list-style-type: disc;
          padding-left: 16px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .bank-loading {
          margin-top: 16px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .bank-warning {
          margin-top: 16px;
          font-size: 12px;
          color: #facc15; /* yellow-400 */
        }
        .bank-details {
          margin-top: 16px;
          font-size: 12px;
          color: #d1d5db; /* gray-300 */
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
        }
        .detail-row dd {
          font-weight: 500;
        }

        .payout-action {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        
        .btn-primary {
          border-radius: 999px;
          background: white;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #e5e7eb; /* gray-200 */
        }
        .btn-primary:disabled {
          opacity: 0.6;
        }
        
        /* From catalogue.tsx */
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .sell-card h2 {
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          color: #e5e7eb;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        .catalogue-table th {
          font-size: 11px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
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
        
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-paid {
          background: #064e3b; /* green-900 */
          color: #6ee7b7; /* emerald-300 */
        }
      `}</style>
    </>
  );
}
