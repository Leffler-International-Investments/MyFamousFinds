// FILE: /pages/management/order-roadmap.tsx

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type RoadmapStep = {
  key: string;
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "blocked";
  completedAt?: string | null;
  details?: string;
};

type DiagnosticResult = {
  ok: true;
  order: {
    id: string;
    status: string;
    listingTitle: string;
    buyerName: string;
    buyerEmail: string;
    sellerName: string;
    sellerId: string;
    total: number;
    currency: string;
    createdAt: string;
  };
  steps: RoadmapStep[];
  cooling: {
    coolingDays: number;
    eligibleAt: string | null;
    daysRemaining: number | null;
    isEligible: boolean;
  };
  payout: {
    status: string;
    mode: string;
    sellerAmount: number | null;
    platformFee: number | null;
    paidAt: string | null;
  };
  warnings: string[];
};

function money(amount: number | null | undefined, currency: string) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STEP_COLORS: Record<RoadmapStep["status"], { bg: string; border: string; dot: string; text: string }> = {
  completed: { bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a", text: "#065f46" },
  current:   { bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb", text: "#1e40af" },
  upcoming:  { bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af", text: "#6b7280" },
  blocked:   { bg: "#fef2f2", border: "#fecaca", dot: "#dc2626", text: "#991b1b" },
};

const STEP_ICONS: Record<RoadmapStep["status"], string> = {
  completed: "\u2705",
  current: "\u23F3",
  upcoming: "\u25CB",
  blocked: "\u274C",
};

export default function OrderRoadmapPage() {
  const { loading: authLoading } = useRequireAdmin();
  const router = useRouter();

  const [orderId, setOrderId] = useState(
    typeof router.query?.orderId === "string" ? router.query.orderId : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  async function runDiagnostic() {
    const id = orderId.trim();
    if (!id) {
      setError("Please enter an order ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/management/orders/roadmap-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load order roadmap");
      }

      setResult(json as DiagnosticResult);
    } catch (e: any) {
      setError(e?.message || "Failed to load order roadmap");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <div className="dashboard-page" />;

  const order = result?.order;
  const steps = result?.steps || [];
  const cooling = result?.cooling;
  const payout = result?.payout;
  const warnings = result?.warnings || [];
  const currentStepIdx = steps.findIndex((s) => s.status === "current");
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <>
      <Head>
        <title>Order Roadmap Diagnostic — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="page-wrap">
          <div className="back-link">
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Search card */}
          <section className="card">
            <h1>Seller / Order Roadmap Diagnostic</h1>
            <p className="muted">
              Enter an Order ID to see the full lifecycle roadmap: from order
              placed through UPS label, pickup, delivery, customer signature,
              14-day cooling period, and seller payout release.
            </p>

            <div className="search-row">
              <input
                className="input"
                placeholder="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runDiagnostic();
                }}
              />
              <button
                className="btn btn-primary"
                onClick={runDiagnostic}
                disabled={loading}
              >
                {loading ? "Loading…" : "Run Diagnostic"}
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}
          </section>

          {result && order && (
            <>
              {/* Warnings */}
              {warnings.length > 0 && (
                <section className="card warn-card">
                  <h2 className="warn-title">Warnings</h2>
                  {warnings.map((w, i) => (
                    <div key={`w-${i}`} className="warn-item">
                      {w}
                    </div>
                  ))}
                </section>
              )}

              {/* Order summary */}
              <section className="card">
                <h2>Order Summary</h2>
                <div className="progress-bar-wrap">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round(
                          (completedCount / steps.length) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="progress-label">
                    {completedCount} of {steps.length} steps complete
                  </span>
                </div>

                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Order ID</span>
                    <span className="summary-value">{order.id}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Status</span>
                    <span className="summary-value pill">{order.status}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Item</span>
                    <span className="summary-value">
                      {order.listingTitle || "—"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Buyer</span>
                    <span className="summary-value">
                      {order.buyerName || "—"}
                      {order.buyerEmail ? ` (${order.buyerEmail})` : ""}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Seller</span>
                    <span className="summary-value">
                      {order.sellerName || order.sellerId || "—"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">
                      {money(order.total, order.currency)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Created</span>
                    <span className="summary-value">
                      {fmtDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Roadmap steps */}
              <section className="card">
                <h2>Order Lifecycle Roadmap</h2>
                <div className="roadmap">
                  {steps.map((step, i) => {
                    const colors = STEP_COLORS[step.status];
                    const icon = STEP_ICONS[step.status];
                    const isLast = i === steps.length - 1;

                    return (
                      <div key={step.key} className="roadmap-step">
                        {/* Timeline connector */}
                        <div className="timeline">
                          <div
                            className="dot"
                            style={{ background: colors.dot }}
                          />
                          {!isLast && (
                            <div
                              className="connector"
                              style={{
                                background:
                                  step.status === "completed"
                                    ? "#16a34a"
                                    : "#e5e7eb",
                              }}
                            />
                          )}
                        </div>

                        {/* Step content */}
                        <div
                          className="step-card"
                          style={{
                            background: colors.bg,
                            borderColor: colors.border,
                          }}
                        >
                          <div className="step-header">
                            <span className="step-icon">{icon}</span>
                            <span
                              className="step-label"
                              style={{ color: colors.text }}
                            >
                              {step.label}
                            </span>
                            <span
                              className="step-badge"
                              style={{
                                background: colors.dot,
                                color: "#fff",
                              }}
                            >
                              {step.status === "completed"
                                ? "Done"
                                : step.status === "current"
                                ? "In Progress"
                                : step.status === "blocked"
                                ? "Blocked"
                                : "Pending"}
                            </span>
                          </div>
                          <p className="step-desc">{step.description}</p>
                          {step.details && (
                            <p className="step-details">{step.details}</p>
                          )}
                          {step.completedAt && (
                            <p className="step-time">
                              {fmtDate(step.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Cooling & Payout details */}
              <section className="card">
                <h2>Cooling Period & Payout</h2>
                <div className="detail-grid">
                  <div className="detail-box">
                    <span className="detail-label">Cooling Period</span>
                    <span className="detail-value">
                      {cooling?.coolingDays} days
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Eligible At</span>
                    <span className="detail-value">
                      {cooling?.eligibleAt
                        ? fmtDate(cooling.eligibleAt)
                        : "Not yet set"}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Days Remaining</span>
                    <span className="detail-value">
                      {cooling?.daysRemaining != null
                        ? `${cooling.daysRemaining} day${
                            cooling.daysRemaining !== 1 ? "s" : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Payout Status</span>
                    <span
                      className={`detail-value payout-badge ${
                        payout?.status === "PAID"
                          ? "paid"
                          : payout?.status === "ELIGIBLE"
                          ? "eligible"
                          : payout?.status === "COOLING"
                          ? "cooling"
                          : "pending"
                      }`}
                    >
                      {payout?.status || "PENDING"}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Payout Mode</span>
                    <span className="detail-value">
                      {payout?.mode === "paypal_auto"
                        ? "Auto (PayPal)"
                        : "Manual"}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Platform Fee</span>
                    <span className="detail-value">
                      {money(payout?.platformFee, order.currency)}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Seller Payout</span>
                    <span className="detail-value">
                      {money(payout?.sellerAmount, order.currency)}
                    </span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">Paid At</span>
                    <span className="detail-value">
                      {payout?.paidAt ? fmtDate(payout.paidAt) : "—"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Quick links */}
              <section className="card">
                <h2>Quick Links</h2>
                <div className="links-row">
                  <Link
                    href="/management/purchases"
                    className="quick-link"
                  >
                    View in Purchases
                  </Link>
                  <Link
                    href="/management/payouts"
                    className="quick-link"
                  >
                    Payouts & Finance
                  </Link>
                  <Link
                    href={`/seller/ups-diagnostics?orderId=${order.id}`}
                    className="quick-link"
                  >
                    UPS Label Diagnostics
                  </Link>
                  <Link
                    href="/management/disputes"
                    className="quick-link"
                  >
                    Returns & Disputes
                  </Link>
                </div>
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f5f5f4;
        }
        .page-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }
        .back-link {
          margin-bottom: 12px;
        }
        .back-link a {
          font-size: 12px;
          color: #6b7280;
          text-decoration: none;
        }
        .back-link a:hover {
          color: #111827;
        }
        .card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 14px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }
        h2 {
          margin: 0 0 14px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .muted {
          color: #57534e;
          font-size: 13px;
          line-height: 1.5;
        }
        .search-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .input {
          flex: 1;
          height: 42px;
          border: 1px solid #d6d3d1;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 15px;
        }
        .input:focus {
          outline: none;
          border-color: #9ca3af;
        }
        .btn {
          border: none;
          border-radius: 8px;
          height: 42px;
          padding: 0 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .btn-primary {
          background: #1c1917;
          color: #fff;
        }
        .btn-primary:hover {
          background: #000;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-box {
          margin-top: 10px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
        }

        /* Warnings */
        .warn-card {
          background: #fffbeb;
          border-color: #fde68a;
        }
        .warn-title {
          color: #92400e;
        }
        .warn-item {
          font-size: 13px;
          color: #78350f;
          padding: 6px 0;
          border-bottom: 1px solid #fde68a;
        }
        .warn-item:last-child {
          border-bottom: none;
        }

        /* Progress bar */
        .progress-bar-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #16a34a;
          border-radius: 999px;
          transition: width 0.3s ease;
        }
        .progress-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Summary grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 10px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
        }
        .summary-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-value {
          font-size: 13px;
          color: #111827;
          font-weight: 600;
          word-break: break-word;
        }
        .pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          background: #0b1220;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          width: fit-content;
        }

        /* Roadmap */
        .roadmap {
          display: flex;
          flex-direction: column;
        }
        .roadmap-step {
          display: flex;
          gap: 16px;
          min-height: 80px;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20px;
          flex-shrink: 0;
          padding-top: 4px;
        }
        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .connector {
          width: 2px;
          flex: 1;
          min-height: 16px;
        }
        .step-card {
          flex: 1;
          border: 1px solid;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 8px;
        }
        .step-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .step-icon {
          font-size: 14px;
        }
        .step-label {
          font-size: 14px;
          font-weight: 700;
        }
        .step-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .step-desc {
          margin: 6px 0 0;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.4;
        }
        .step-details {
          margin: 4px 0 0;
          font-size: 12px;
          color: #111827;
          font-weight: 600;
        }
        .step-time {
          margin: 4px 0 0;
          font-size: 11px;
          color: #6b7280;
        }

        /* Detail grid */
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .detail-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
        }
        .detail-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-value {
          font-size: 14px;
          color: #111827;
          font-weight: 700;
        }
        .payout-badge {
          display: inline-block;
          width: fit-content;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
        }
        .payout-badge.paid {
          background: #ecfdf5;
          color: #065f46;
        }
        .payout-badge.eligible {
          background: #dbeafe;
          color: #1e40af;
        }
        .payout-badge.cooling {
          background: #fef3c7;
          color: #92400e;
        }
        .payout-badge.pending {
          background: #f3f4f6;
          color: #6b7280;
        }

        /* Quick links */
        .links-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .quick-link {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          text-decoration: none;
          transition: background 0.15s;
        }
        .quick-link:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .search-row {
            flex-direction: column;
          }
          .input {
            width: 100%;
          }
          h1 {
            font-size: 22px;
          }
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .links-row {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
