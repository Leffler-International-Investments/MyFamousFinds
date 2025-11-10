// FILE: /pages/management/settings.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementSettings() {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="dark-theme-page" />; // Dark theme skeleton

  return (
    <>
      <Head>
        <title>System Settings — Admin</title>
      </Head>

      {/* Use the same wrapper class as sell.tsx */}
      <div className="dark-theme-page">
        <Header />

        {/* Use the same <main> class as sell.tsx */}
        <main className="section">
          {/* Use the same header class as sell.tsx */}
          <div className="section-header">
            <div>
              <h1>System Settings</h1>
              <p style={{ opacity: 0.8, marginTop: 4 }}>
                Global settings for Famous-Finds marketplace.
              </p>
            </div>
            {/* Use the .cta class from globals.css */}
            <Link href="/management/dashboard" className="cta">
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Use the .sell-card class from sell.tsx's styles */}
          <section className="sell-card">
            <h2>Marketplace configuration</h2>

            <div className="settings-grid">
              <div className="form-field">
                <label htmlFor="default-currency">Default Currency</label>
                <select id="default-currency" value="USD" disabled>
                  <option>USD</option>
                </select>
                <p className="field-help">
                  All listings, statements, and payouts are currently locked to
                  US Dollars (USD).
                </p>
              </div>

              <div className="form-field-check">
                <input id="maintenance-mode" type="checkbox" disabled />
                <label htmlFor="maintenance-mode">
                  Maintenance mode (placeholder only — controlled via deploys).
                </label>
              </div>
            </div>

            <p className="note">
              Note: This page is currently informational. Currency and platform
              mode are controlled by code and infrastructure, not live toggles.
            </p>
          </section>
        </main>

        <Footer />
      </div>

      {/* This <style jsx> block is added to match sell.tsx. */}
      <style jsx>{`
        /* Copied from sell.tsx */
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .sell-card h2 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #9ca3af;
          font-weight: 600;
        }

        .settings-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-field label {
          font-size: 13px;
          font-weight: 500;
          color: #e5e7eb;
        }
        
        .form-field select {
          background: #020617;
          border-radius: 8px;
          border: 1px solid #374151;
          padding: 8px 10px;
          color: #e5e7eb;
          font-size: 14px;
        }
        .form-field select:disabled {
          opacity: 0.7;
        }

        .field-help {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
        
        .form-field-check {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px; /* align with label */
        }
        .form-field-check label {
          font-size: 13px;
          color: #9ca3af;
        }
        
        .note {
          margin-top: 24px;
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>
    </>
  );
}
