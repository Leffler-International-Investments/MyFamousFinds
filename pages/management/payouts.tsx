// FILE: /pages/management/payouts.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { mgmtFetch } from "../../utils/managementClient";

type Payout = {
  id: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type Props = {
  payouts: Payout[];
};

export default function ManagementPayouts({ payouts }: Props) {
  const { loading } = useRequireAdmin();
  const [payoutMode, setPayoutMode] = useState<"manual" | "stripe_connect_auto">("manual");
  const [coolingDays, setCoolingDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Load current payout settings
  const loadSettings = useCallback(async () => {
    try {
      const resp = await mgmtFetch("/api/admin/payout-settings");
      const data = await resp.json();
      if (data.ok && data.settings) {
        setPayoutMode(data.settings.payoutMode || "manual");
        setCoolingDays(data.settings.defaultCoolingDays ?? 7);
      }
    } catch (e) {
      console.error("Failed to load payout settings", e);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) loadSettings();
  }, [loading, loadSettings]);

  // Save settings
  async function handleSaveSettings() {
    setSaving(true);
    try {
      const resp = await mgmtFetch("/api/admin/payout-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutMode, defaultCoolingDays: coolingDays }),
      });
      const data = await resp.json();
      if (!data.ok) alert("Save failed: " + (data.error || "Unknown error"));
    } catch (e: any) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // Manual payout run
  async function handleRunPayouts() {
    if (!confirm("Run payouts now for all eligible orders?")) return;
    setRunning(true);
    setRunResult(null);
    try {
      const resp = await mgmtFetch("/api/admin/payout/run-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await resp.json();
      if (data.ok) {
        setRunResult(
          `Processed: ${data.processed}, Paid: ${data.paid}` +
          (data.message ? ` (${data.message})` : "")
        );
      } else {
        setRunResult("Error: " + (data.error || "Unknown"));
      }
    } catch (e: any) {
      setRunResult("Error: " + e.message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Payouts &amp; Finance — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Payouts &amp; Finance</h1>
              <p>
                Review seller payouts and platform fees, denominated in USD.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* ── Payout Mode Toggle ── */}
          <div className="settings-card">
            <h2>Payout Settings</h2>
            {loadingSettings ? (
              <p style={{ color: "#6b7280" }}>Loading settings...</p>
            ) : (
              <>
                <div className="mode-toggle">
                  <label className="mode-label">
                    <span>Payout Mode:</span>
                  </label>
                  <div className="mode-options">
                    <button
                      className={`mode-btn ${payoutMode === "manual" ? "active" : ""}`}
                      onClick={() => setPayoutMode("manual")}
                    >
                      Manual
                    </button>
                    <button
                      className={`mode-btn ${payoutMode === "stripe_connect_auto" ? "active" : ""}`}
                      onClick={() => setPayoutMode("stripe_connect_auto")}
                    >
                      Auto Pay (Stripe Connect)
                    </button>
                  </div>
                </div>

                <p className="mode-desc">
                  {payoutMode === "manual"
                    ? "Manual: You review and approve each payout individually."
                    : "Auto Pay: Payouts are automatically sent to sellers via Stripe Connect after the cooling period ends. Cron runs every 12 hours."}
                </p>

                <div className="cooling-row">
                  <label htmlFor="coolingDays">Cooling Period (days):</label>
                  <input
                    id="coolingDays"
                    type="number"
                    min={0}
                    max={60}
                    value={coolingDays}
                    onChange={(e) => setCoolingDays(Number(e.target.value))}
                    className="cooling-input"
                  />
                </div>

                <div className="settings-actions">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="save-btn"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>

                  <button
                    onClick={handleRunPayouts}
                    disabled={running}
                    className="run-btn"
                  >
                    {running ? "Running..." : "Run Payouts Now"}
                  </button>
                </div>

                {runResult && (
                  <p className="run-result">{runResult}</p>
                )}
              </>
            )}
          </div>

          {/* ── Payout History Table ── */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Seller</th>
                  <th style={{ textAlign: "right" }}>Amount (USD)</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.sellerName}</td>
                    <td style={{ textAlign: "right" }}>
                      {p.amount
                        ? p.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—"}
                    </td>
                    <td>{p.status}</td>
                    <td>{p.createdAt}</td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-message">
                      No payouts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .settings-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .settings-card h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #111827;
        }
        .mode-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .mode-label span {
          font-weight: 500;
          color: #374151;
        }
        .mode-options {
          display: flex;
          gap: 8px;
        }
        .mode-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #f9fafb;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s ease;
        }
        .mode-btn:hover {
          background: #f3f4f6;
        }
        .mode-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        .mode-desc {
          color: #6b7280;
          font-size: 13px;
          margin: 8px 0 16px 0;
        }
        .cooling-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .cooling-row label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }
        .cooling-input {
          width: 80px;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        .settings-actions {
          display: flex;
          gap: 12px;
        }
        .save-btn {
          padding: 8px 20px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .run-btn {
          padding: 8px 20px;
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .run-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .run-result {
          margin-top: 12px;
          padding: 8px 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #166534;
          font-size: 13px;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead {
          background: #f9fafb;
        }
        .data-table th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #374151;
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 8px 12px;
          color: #111827;
        }
        .data-table td:first-child {
          font-weight: 500;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) {
    return { props: { payouts: [] } };
  }

  try {
    const snap = await adminDb
      .collection("payouts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const payouts: Payout[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        sellerName: d.sellerName || "",
        amount: Number(d.amount || 0),
        currency: d.currency || "USD",
        status: d.status || "Pending",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { payouts } };
  } catch (err) {
    console.error("Error loading payouts", err);
    return { props: { payouts: [] } };
  }
};
