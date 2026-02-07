// FILE: /pages/management/orders.tsx

import { useState, useMemo } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type ShippingInfo = {
  status?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

type Order = {
  id: string;
  buyerEmail: string;
  sellerName: string;
  total: number;
  status: string;
  createdAt: string;
  shipping: ShippingInfo;
};

type Props = {
  initialOrders: Order[];
};

export default function ManagementOrders({ initialOrders }: Props) {
  const { loading } = useRequireAdmin();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<
    Record<string, { carrier: string; trackingNumber: string }>
  >({});

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.buyerEmail.toLowerCase().includes(q) ||
        o.sellerName.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const handleFieldChange = (
    orderId: string,
    field: "carrier" | "trackingNumber",
    value: string
  ) => {
    setEditing((prev) => ({
      ...prev,
      [orderId]: {
        carrier: prev[orderId]?.carrier ?? "",
        trackingNumber: prev[orderId]?.trackingNumber ?? "",
        [field]: value,
      },
    }));
  };

  const handleSaveTracking = async (orderId: string) => {
    const edit = editing[orderId];
    if (!edit?.carrier || !edit?.trackingNumber) {
      setError("Carrier and tracking number are required.");
      return;
    }

    try {
      setSavingId(orderId);
      setError(null);

      const res = await fetch("/api/orders/updateTracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          carrier: edit.carrier,
          trackingNumber: edit.trackingNumber,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update tracking");
      }

      // Update local state so UI reflects new tracking immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                shipping: {
                  ...o.shipping,
                  carrier: edit.carrier,
                  trackingNumber: edit.trackingNumber,
                  status: "shipped",
                },
              }
            : o
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update tracking");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Orders Overview — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Orders Overview</h1>
              <p>
                Search and view all platform orders and add DHL / UPS tracking
                once items ship.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          {error && <p className="banner-error">{error}</p>}

          <div className="filters-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, buyer, or seller…"
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: "200px" }}
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th style={{ textAlign: "right" }}>Total (USD)</th>
                  <th>Status</th>
                  <th>Carrier</th>
                  <th>Tracking #</th>
                  <th>Save</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const ship = o.shipping || {};
                  const edit = editing[o.id] || {
                    carrier: ship.carrier || "",
                    trackingNumber: ship.trackingNumber || "",
                  };

                  return (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.buyerEmail}</td>
                      <td>{o.sellerName}</td>
                      <td style={{ textAlign: "right" }}>
                        {o.total
                          ? o.total.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })
                          : "—"}
                      </td>
                      <td>{ship.status || o.status}</td>
                      <td>
                        <select
                          value={edit.carrier}
                          onChange={(e) =>
                            handleFieldChange(o.id, "carrier", e.target.value)
                          }
                          className="form-input small"
                        >
                          <option value="">Select</option>
                          <option value="DHL">DHL</option>
                          <option value="UPS">UPS</option>
                          <option value="FedEx">FedEx</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={edit.trackingNumber}
                          onChange={(e) =>
                            handleFieldChange(
                              o.id,
                              "trackingNumber",
                              e.target.value
                            )
                          }
                          className="form-input small"
                          placeholder="Tracking number"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleSaveTracking(o.id)}
                          disabled={savingId === o.id}
                          className="btn-save"
                        >
                          {savingId === o.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                      <td>{o.createdAt}</td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-message">
                      No orders match this filter.
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
        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .form-input {
          max-width: 320px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }
        .form-input.small {
          max-width: 140px;
          font-size: 12px;
          padding: 6px 8px;
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
        .btn-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .banner-error {
          margin-bottom: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          background: #7f1d1d;
          color: #fee2e2;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const initialOrders: Order[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        buyerEmail: d.buyerEmail || "",
        sellerName: d.sellerName || "",
        total: Number(d.total || 0),
        status: d.status || "Pending",
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        shipping: d.shipping || {},
      };
    });

    return { props: { initialOrders } };
  } catch (err) {
    console.error("Error loading orders", err);
    return { props: { initialOrders: [] } };
  }
};
