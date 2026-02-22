// FILE: /pages/management/authentication-complaints.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Complaint = {
  id: string;
  fromName: string;
  fromEmail: string;
  orderNumber: string;
  itemDescription: string;
  concern: string;
  status: string;
  createdAt: string;
};

type Props = {
  complaints: Complaint[];
};

export default function AuthenticationComplaints({ complaints }: Props) {
  const { loading } = useRequireAdmin();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of complaints) map[c.id] = c.status;
    return map;
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "Open" | "Closed">("all");

  if (loading) return <div className="dashboard-page" />;

  async function toggleStatus(id: string) {
    const current = statusMap[id] || "Open";
    const next = current === "Open" ? "Closed" : "Open";
    setUpdatingId(id);
    try {
      const res = await fetch("/api/management/auth-complaint-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: id, status: next }),
      });
      if (res.ok) {
        setStatusMap((prev) => ({ ...prev, [id]: next }));
      }
    } catch {
      // ignore
    }
    setUpdatingId(null);
  }

  const filtered =
    filter === "all"
      ? complaints
      : complaints.filter((c) => (statusMap[c.id] || c.status) === filter);

  return (
    <>
      <Head>
        <title>Authentication Complaints — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Authentication Complaints</h1>
              <p>
                Buyer-submitted authenticity concerns. Click a row to view
                the full complaint details.
              </p>
            </div>
            <Link href="/management/dashboard">
              &larr; Back to Management Dashboard
            </Link>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            <button
              className={`filter-btn${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({complaints.length})
            </button>
            <button
              className={`filter-btn${filter === "Open" ? " active" : ""}`}
              onClick={() => setFilter("Open")}
            >
              Open (
              {
                complaints.filter(
                  (c) => (statusMap[c.id] || c.status) === "Open"
                ).length
              }
              )
            </button>
            <button
              className={`filter-btn${filter === "Closed" ? " active" : ""}`}
              onClick={() => setFilter("Closed")}
            >
              Closed (
              {
                complaints.filter(
                  (c) => (statusMap[c.id] || c.status) === "Closed"
                ).length
              }
              )
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>From</th>
                  <th>Item</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isOpen = expandedId === c.id;
                  const st = statusMap[c.id] || c.status;
                  return (
                    <tr key={c.id} className="ticket-group">
                      <td colSpan={7} style={{ padding: 0 }}>
                        {/* Summary row */}
                        <div
                          className={`ticket-row${isOpen ? " expanded" : ""}`}
                          onClick={() =>
                            setExpandedId(isOpen ? null : c.id)
                          }
                        >
                          <span className="col-ref">#{c.id}</span>
                          <span className="col-from">
                            {c.fromName}{" "}
                            <span className="email-dim">{c.fromEmail}</span>
                          </span>
                          <span className="col-item">
                            {c.itemDescription || "—"}
                          </span>
                          <span className="col-order">
                            {c.orderNumber || "—"}
                          </span>
                          <span className="col-status">
                            <span
                              className={`badge badge-${st.toLowerCase()}`}
                            >
                              {st}
                            </span>
                          </span>
                          <span className="col-date">{c.createdAt}</span>
                          <span className="col-action">
                            <button
                              className="status-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(c.id);
                              }}
                              disabled={updatingId === c.id}
                            >
                              {updatingId === c.id
                                ? "..."
                                : st === "Open"
                                ? "Close"
                                : "Reopen"}
                            </button>
                          </span>
                        </div>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="ticket-detail">
                            {c.itemDescription && (
                              <>
                                <p className="detail-label">Item:</p>
                                <p className="detail-text">
                                  {c.itemDescription}
                                </p>
                              </>
                            )}
                            {c.orderNumber && (
                              <>
                                <p className="detail-label">Order Number:</p>
                                <p className="detail-text">{c.orderNumber}</p>
                              </>
                            )}
                            <p className="detail-label">
                              Authenticity Concern:
                            </p>
                            <p className="detail-message">{c.concern}</p>
                            <a
                              href={`mailto:${c.fromEmail}?subject=Re: Authentication Complaint #${c.id}`}
                              className="reply-link"
                            >
                              Reply via email &rarr;
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-message">
                      No authentication complaints
                      {filter !== "all"
                        ? ` with status "${filter}"`
                        : " yet"}
                      .
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
        .filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .filter-btn {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
          color: #374151;
        }
        .filter-btn.active {
          background: #111827;
          color: #fff;
          border-color: #111827;
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
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }

        .ticket-row {
          display: grid;
          grid-template-columns: 90px 1fr 1fr 100px 80px 120px 80px;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .ticket-row:hover {
          background: #f9fafb;
        }
        .ticket-row.expanded {
          background: #f3f4f6;
        }
        .col-ref {
          font-weight: 500;
          font-size: 13px;
          color: #111827;
        }
        .col-from {
          font-size: 13px;
        }
        .col-item {
          font-size: 13px;
          color: #374151;
        }
        .col-order {
          font-size: 13px;
          color: #374151;
        }
        .email-dim {
          color: #6b7280;
        }
        .col-date {
          font-size: 12px;
          color: #6b7280;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-open {
          background: #fef2f2;
          color: #991b1b;
        }
        .badge-closed {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-btn {
          padding: 4px 10px;
          font-size: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          color: #374151;
        }
        .status-btn:hover {
          background: #f3f4f6;
        }

        .ticket-detail {
          padding: 12px 20px 16px;
          background: #fafafa;
          border-top: 1px solid #e5e7eb;
        }
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 2px;
          margin-top: 8px;
        }
        .detail-label:first-child {
          margin-top: 0;
        }
        .detail-text {
          font-size: 14px;
          color: #111827;
          margin-bottom: 4px;
        }
        .detail-message {
          white-space: pre-wrap;
          font-size: 14px;
          color: #111827;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .reply-link {
          font-size: 13px;
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .reply-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .ticket-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .col-ref,
          .col-date,
          .col-action {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("authenticationComplaints")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const complaints: Complaint[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        fromName: d.fromName || "",
        fromEmail: d.fromEmail || "",
        orderNumber: d.orderNumber || "",
        itemDescription: d.itemDescription || "",
        concern: d.concern || "",
        status: d.status || "Open",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { complaints } };
  } catch (err) {
    console.error("Error loading authentication complaints", err);
    return { props: { complaints: [] } };
  }
};
