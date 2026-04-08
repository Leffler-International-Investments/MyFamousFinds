// FILE: /pages/management/payouts.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState } from "react";

type Payout = {
  id: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type EligibleOrder = {
  id: string;
  sellerName: string;
  listingTitle: string;
  total: number;
  payoutStatus: string;
  eligibleAt: string;
};

type PayoutSettings = {
  payoutMode: string;
  defaultCoolingDays: number;
};

type Props = {
  payouts: Payout[];
  eligibleOrders: EligibleOrder[];
  settings: PayoutSettings;
};

export default function ManagementPayouts({
  payouts,
  eligibleOrders: initialEligible,
  settings,
}: Props) {
  const { loading } = useRequireAdmin();
  const [eligible, setEligible] = useState(initialEligible);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [runningAuto, setRunningAuto] = useState(false);

  const handleManualPayout = async (orderId: string) => {
    setProcessingId(orderId);
    setActionMsg(null);
    try {
      const res = await fetch("/api/management/orders/mark-paid-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, payoutMethod: "manual" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Payout failed");
      setEligible((prev) => prev.filter((o) => o.id !== orderId));
      setActionMsg(`Order ${orderId} marked as paid out.`);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunAuto = async () => {
    setRunningAuto(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/payout/run-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Auto payout failed");
      setActionMsg(
        `Auto payout complete: ${data.processed} processed, ${data.paid} paid.${
          data.message ? ` (${data.message})` : ""
        }`
      );
      if (data.paid > 0) {
        setEligible([]);
      }
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setRunningAuto(false);
    }
  };

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

          {/* Payout mode indicator + action */}
          <div className="mode-banner">
            <div className="mode-info">
              <span className="mode-label">
                Current mode:{" "}
                <strong>
                  {settings.payoutMode === "paypal_auto"
                    ? "Auto (PayPal Payouts)"
                    : "Manual (by management)"}
                </strong>
              </span>
              <span className="mode-label">
                Cooling period:{" "}
                <strong>
                  {settings.defaultCoolingDays} day
                  {settings.defaultCoolingDays !== 1 ? "s" : ""}
                </strong>
              </span>
            </div>
            {settings.payoutMode === "paypal_auto" && (
              <button
                type="button"
                className="btn-action"
                onClick={handleRunAuto}
                disabled={runningAuto}
              >
                {runningAuto ? "Running..." : "Run auto payouts now"}
              </button>
            )}
          </div>

          {actionMsg && (
            <div
              className={`action-msg ${
                actionMsg.startsWith("Error") ? "action-error" : "action-ok"
              }`}
            >
              {actionMsg}
            </div>
          )}

          {/* Eligible orders for manual payout */}
          {eligible.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 className="section-subtitle">
                Orders eligible for payout ({eligible.length})
              </h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Seller</th>
                      <th>Item</th>
                      <th style={{ textAlign: "right" }}>Amount (USD)</th>
                      <th>Status</th>
                      <th>Eligible Since</th>
                      {settings.payoutMode === "manual" && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {eligible.map((o) => (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.sellerName}</td>
                        <td>{o.listingTitle}</td>
                        <td style={{ textAlign: "right" }}>
                          {o.total
                            ? o.total.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })
                            : "---"}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              o.payoutStatus === "ELIGIBLE"
                                ? "status-eligible"
                                : "status-cooling"
                            }`}
                          >
                            {o.payoutStatus}
                          </span>
                        </td>
                        <td>{o.eligibleAt}</td>
                        {settings.payoutMode === "manual" && (
                          <td>
                            {o.payoutStatus === "ELIGIBLE" ? (
                              <button
                                type="button"
                                className="btn-payout"
                                onClick={() => handleManualPayout(o.id)}
                                disabled={processingId === o.id}
                              >
                                {processingId === o.id
                                  ? "Processing..."
                                  : "Pay seller"}
                              </button>
                            ) : (
                              <span className="cooling-text">Cooling</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payout history */}
          <h2 className="section-subtitle">Payout history</h2>
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
                        : "---"}
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
        .mode-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .mode-info {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .mode-label {
          font-size: 13px;
          color: #374151;
        }
        .btn-action {
          border-radius: 6px;
          background: #2563eb;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          border: none;
          cursor: pointer;
        }
        .btn-action:hover {
          background: #1d4ed8;
        }
        .btn-action:disabled {
          opacity: 0.6;
        }
        .action-msg {
          margin-bottom: 16px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }
        .action-ok {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .action-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .section-subtitle {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
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
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-eligible {
          background: #ecfdf5;
          color: #065f46;
        }
        .status-cooling {
          background: #fef3c7;
          color: #92400e;
        }
        .btn-payout {
          border-radius: 6px;
          background: #059669;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          border: none;
          cursor: pointer;
        }
        .btn-payout:hover {
          background: #047857;
        }
        .btn-payout:disabled {
          opacity: 0.6;
        }
        .cooling-text {
          font-size: 12px;
          color: #92400e;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) return { props: { payouts: [], eligibleOrders: [], settings: { payoutMode: "manual", defaultCoolingDays: 14 } } };

  try {
    // Load payout settings
    const settingsSnap = await adminDb.doc("settings/payout").get();
    const settingsData: any = settingsSnap.exists ? settingsSnap.data() : {};
    const settings: PayoutSettings = {
      payoutMode: settingsData.payoutMode || "manual",
      defaultCoolingDays:
        typeof settingsData.defaultCoolingDays === "number"
          ? settingsData.defaultCoolingDays
          : 7,
    };

    // Load payout history
    const payoutSnap = await adminDb
      .collection("payouts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const payouts: Payout[] = payoutSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        sellerName: d.sellerName || "",
        amount: Number(d.amount || 0),
        currency: d.currency || "USD",
        status: d.status || "Pending",
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    // Load orders eligible for payout (COOLING or ELIGIBLE)
    let eligibleOrders: EligibleOrder[] = [];
    try {
      const orderSnap = await adminDb
        .collection("orders")
        .where("payout.status", "in", ["COOLING", "ELIGIBLE"])
        .limit(100)
        .get();

      eligibleOrders = orderSnap.docs.map((doc) => {
        const d: any = doc.data() || {};
        const eligibleAtDate = d.payout?.eligibleAt?.toDate?.();
        return {
          id: doc.id,
          sellerName: d.sellerName || d.seller?.name || "",
          listingTitle: d.listingTitle || d.items?.[0]?.title || "",
          total: Number(d.totals?.total || d.total || 0),
          payoutStatus: d.payout?.status || "COOLING",
          eligibleAt: eligibleAtDate
            ? eligibleAtDate.toLocaleString("en-US")
            : "---",
        };
      });
    } catch {
      // Index may not exist yet
    }

    return { props: { payouts, eligibleOrders, settings } };
  } catch (err) {
    console.error("Error loading payouts", err);
    return {
      props: {
        payouts: [],
        eligibleOrders: [],
        settings: { payoutMode: "manual", defaultCoolingDays: 14 },
      },
    };
  }
};
