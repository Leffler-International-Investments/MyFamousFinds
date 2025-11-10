// FILE: /pages/management/analytics.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Metric = {
  label: string;
  value: string;
  note?: string;
};

const METRICS: Metric[] = [
  {
    label: "GMV (Last 30 days)",
    value: "$0",
    note: "Live GMV will appear once orders are flowing through the system.",
  },
  {
    label: "Active Sellers",
    value: "0",
    note: "Sellers will be counted automatically when onboarded and verified.",
  },
  {
    label: "Active Listings",
    value: "0",
    note: "Listings will appear here once items are approved for sale.",
  },
  {
    label: "Dispute Rate",
    value: "0.0%",
    note: "Disputes and chargebacks will be tracked as your marketplace runs.",
  },
];

export default function ManagementAnalytics() {
  const { loading } = useRequireAdmin();

  // While we check admin access, keep the same frame but show a lightweight message
  if (loading) {
    return (
      <>
        <Head>
          <title>Analytics &amp; Reports — Admin</title>
        </Head>
        {/* Use light theme classes from globals.css */}
        <div className="dashboard-page">
          <Header />
          <main className="dashboard-main">
            <p>Checking admin access…</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics &amp; Reports — Admin</title>
      </Head>

      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Analytics &amp; Reports</h1>
              <p>
                High-level KPIs for buyers, sellers, orders, and marketplace
                health.
              </p>
            </div>

            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Metric cards */}
          <div className="metrics-grid">
            {METRICS.map((m) => (
              <div key={m.label} className="metric-card">
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">{m.value}</p>
                {m.note && <p className="metric-note">{m.note}</p>}
              </div>
            ))}
          </div>

          {/* Downloads section */}
          <section className="report-card">
            <h2>Downloads</h2>
            <p className="report-subtitle">
              Export CSV-ready reports once your orders and payouts data is
              connected. These buttons are wired into the UI and can later call
              real export endpoints.
            </p>

            <div className="report-buttons">
              <button type="button" className="btn-report">
                Orders (Last 30 days)
              </button>
              <button type="button" className="btn-report">
                Sellers Performance
              </button>
              <button type="button" className="btn-report">
                Listings Conversion
              </button>
            </div>
          </section>

          <p className="page-note">
            This view is ready for live data. Once your orders, payouts and
            disputes are stored in your database (for example, in Firestore or a
            warehouse), you can plug in real metrics here or connect the same
            data to BI tools such as BigQuery or Metabase.
          </p>
        </main>

        <Footer />
      </div>

      {/* Styles for the light theme analytics page */}
      <style jsx>{`
        .metrics-grid {
          margin-bottom: 24px;
          display: grid;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .metric-card {
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .metric-label {
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
        .metric-value {
          margin-top: 4px;
          font-size: 18px;
          font-weight: 600;
          color: #111827; /* gray-900 */
        }
        .metric-note {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280; /* gray-500 */
          line-height: 1.4;
        }
        
        .report-card {
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .report-card h2 {
          font-size: 14px;
          font-weight: 500;
          color: #111827; /* gray-900 */
        }
        .report-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #4b5563; /* gray-600 */
        }
        .report-buttons {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .btn-report {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #f9fafb; /* gray-50 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #374151; /* gray-700 */
          cursor: pointer;
        }
        .btn-report:hover {
          border-color: #d1d5db; /* gray-300 */
        }
        
        .page-note {
          margin-top: 16px;
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
      `}</style>
    </>
  );
}
