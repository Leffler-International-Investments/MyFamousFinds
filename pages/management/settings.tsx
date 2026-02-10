// FILE: /pages/management/settings.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useEffect, useState, useCallback } from "react";

type PayoutMode = "manual" | "stripe_connect_auto";

export default function ManagementSettings() {
  const { loading } = useRequireAdmin();

  const [payoutMode, setPayoutMode] = useState<PayoutMode>("manual");
  const [coolingDays, setCoolingDays] = useState(7);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  const loadPayoutSettings = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const res = await fetch("/api/management/settings/payouts");
      const data = await res.json();
      if (data.ok && data.settings) {
        setPayoutMode(data.settings.payoutMode || "manual");
        setCoolingDays(data.settings.defaultCoolingDays ?? 7);
      }
    } catch {
      // defaults already set
    } finally {
      setPayoutLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) loadPayoutSettings();
  }, [loading, loadPayoutSettings]);

  const savePayoutSettings = async () => {
    setPayoutSaving(true);
    setPayoutMsg(null);
    try {
      const res = await fetch("/api/management/settings/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutMode, defaultCoolingDays: coolingDays }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      setPayoutMsg("Payout settings saved.");
    } catch (err: any) {
      setPayoutMsg(`Error: ${err.message}`);
    } finally {
      setPayoutSaving(false);
    }
  };

  if (loading) return <div className="dark-theme-page" />;

  return (
    <>
      <Head>
        <title>System Settings — Admin</title>
      </Head>

      <div className="dark-theme-page">
        <Header />

        <main className="section">
          <div className="section-header">
            <div>
              <h1>System Settings</h1>
              <p style={{ opacity: 0.8, marginTop: 4 }}>
                Global settings for Famous-Finds marketplace.
              </p>
            </div>
            <Link href="/management/dashboard" className="cta">
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Marketplace configuration */}
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
          </section>

          {/* Seller payout settings */}
          <section className="sell-card" style={{ marginTop: 24 }}>
            <h2>Seller payout settings</h2>

            {payoutLoading ? (
              <p className="field-help">Loading payout settings...</p>
            ) : (
              <>
                <div className="settings-grid">
                  <div className="form-field">
                    <label htmlFor="payout-mode">Payout Mode</label>
                    <select
                      id="payout-mode"
                      value={payoutMode}
                      onChange={(e) => setPayoutMode(e.target.value as PayoutMode)}
                    >
                      <option value="manual">
                        Manual — Management triggers payouts
                      </option>
                      <option value="stripe_connect_auto">
                        Auto — Platform pays via Stripe Connect
                      </option>
                    </select>
                    <p className="field-help">
                      {payoutMode === "manual"
                        ? "Payouts are initiated manually by admin staff from the Payouts page."
                        : "Eligible orders are automatically paid out to sellers via Stripe Connect."}
                    </p>
                  </div>

                  <div className="form-field">
                    <label htmlFor="cooling-days">
                      Cooling Period (days)
                    </label>
                    <input
                      id="cooling-days"
                      type="number"
                      min={0}
                      max={60}
                      value={coolingDays}
                      onChange={(e) =>
                        setCoolingDays(
                          Math.max(0, Math.min(60, parseInt(e.target.value) || 0))
                        )
                      }
                    />
                    <p className="field-help">
                      Number of days after delivery confirmation before seller
                      funds become eligible for payout (0–60). Default is 7.
                    </p>
                  </div>
                </div>

                <div className="payout-actions">
                  <button
                    type="button"
                    onClick={savePayoutSettings}
                    disabled={payoutSaving}
                    className="btn-save"
                  >
                    {payoutSaving ? "Saving..." : "Save payout settings"}
                  </button>
                  {payoutMsg && (
                    <span
                      className={
                        payoutMsg.startsWith("Error") ? "msg-error" : "msg-ok"
                      }
                    >
                      {payoutMsg}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        </main>

        <Footer />
      </div>

      <style jsx>{`
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

        .form-field select,
        .form-field input[type="number"] {
          background: #020617;
          border-radius: 8px;
          border: 1px solid #374151;
          padding: 8px 10px;
          color: #e5e7eb;
          font-size: 14px;
        }
        .form-field select:disabled,
        .form-field input:disabled {
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
          margin-top: 20px;
        }
        .form-field-check label {
          font-size: 13px;
          color: #9ca3af;
        }

        .payout-actions {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-save {
          border-radius: 999px;
          background: white;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-save:hover {
          background: #e5e7eb;
        }
        .btn-save:disabled {
          opacity: 0.6;
        }
        .msg-ok {
          font-size: 12px;
          color: #6ee7b7;
        }
        .msg-error {
          font-size: 12px;
          color: #fca5a5;
        }
      `}</style>
    </>
  );
}
