// FILE: /pages/management/settings.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementSettings() {
  const { loading } } = useRequireAdmin();
  if (loading) return <div className="dark-theme-page"></div>;

  return (
    <>
      <Head>
        <title>System Settings — Admin</title>
      </Head>

      {/* This page uses the dark theme, like sell.tsx */}
      <div className="dark-theme-page">
        <Header />

        {/* It uses the .section and .section-header classes from globals.css */}
        <main className="section">
          <div className="section-header">
            <div>
              <h1>System Settings</h1>
              <p style={{ opacity: 0.8, marginTop: 4 }}>
                Global settings for Famous-Finds marketplace.
              </p>
            </div>
            <Link href="/management/dashboard" className="cta">
              ← Back to Dashboard
            </Link>
          </div>

          {/* This card is custom, so we style it with JSX */}
          <section className="settings-card">
            <h2>Marketplace configuration</h2>

            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="default-currency">Default Currency</label>
                <select id="default-currency" value="USD" disabled>
                  <option>USD</option>
                </select>
                <p className="note">
                  All listings, statements, and payouts are currently locked to
                  US Dollars (USD).
                </p>
              </div>

              <div className="settings-field">
                <label>Maintenance Mode</label>
                <div className="checkbox-row">
                  <input
                    id="maintenance-mode"
                    type="checkbox"
                    disabled
                  />
                  <label htmlFor="maintenance-mode">
                    Enable maintenance mode
                  </label>
                </div>
                 <p className="note">
                  (Placeholder only — controlled via deploys).
                </p>
              </div>
            </div>

            <p className="note" style={{ marginTop: 24 }}>
              Note: This page is currently informational. Currency and platform
              mode are controlled by code and infrastructure, not live toggles.
            </p>
          </section>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .settings-card {
          background: #111827; /* gray-900 */
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid #1f2937; /* gray-800 */
        }
        .settings-card h2 {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af; /* gray-400 */
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .settings-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 600px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
        .settings-field {
          display: flex;
          flex-direction: column;
        }
        .settings-field > label {
          font-size: 13px;
          font-weight: 500;
          color: #e5e7eb; /* gray-200 */
          margin-bottom: 6px;
        }
        select,
        input[type="text"] {
          background: #020617; /* blue-950 */
          border-radius: 8px;
          border: 1px solid #374151; /* gray-700 */
          padding: 8px 10px;
          color: #e5e7eb;
          font-size: 14px;
        }
        select:disabled {
          opacity: 0.7;
          background: #1e293b; /* slate-800 */
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .checkbox-row label {
          font-size: 14px;
          color: #e5e7eb; /* gray-200 */
        }
        input[type="checkbox"] {
          height: 16px;
          width: 16px;
          border-radius: 4px;
          border: 1px solid #374151;
          background: #020617;
        }
        input[type="checkbox"]:disabled {
          opacity: 0.6;
        }
        .note {
          margin-top: 8px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
      `}</style>
    </>
  );
}
