// FILE: /pages/management/support-tickets.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Ticket = {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  message: string;
  status: string;
  createdAt: string;
};

type Props = {
  tickets: Ticket[];
};

export default function ManagementSupportTickets({ tickets }: Props) {
  const { loading } = useRequireAdmin();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of tickets) map[t.id] = t.status;
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
      const res = await fetch("/api/management/support-ticket-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: id, status: next }),
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
      ? tickets
      : tickets.filter((t) => (statusMap[t.id] || t.status) === filter);

  return (
    <>
      <Head>
        <title>Support Tickets — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Support Tickets</h1>
              <p>
                Messages submitted through the contact form. Click a row to view
                the full message.
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
              All ({tickets.length})
            </button>
            <button
              className={`filter-btn${filter === "Open" ? " active" : ""}`}
              onClick={() => setFilter("Open")}
            >
              Open (
              {
                tickets.filter(
                  (t) => (statusMap[t.id] || t.status) === "Open"
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
                tickets.filter(
                  (t) => (statusMap[t.id] || t.status) === "Closed"
                ).length
              }
              )
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Subject</th>
                  <th>From</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isOpen = expandedId === t.id;
                  const st = statusMap[t.id] || t.status;
                  return (
                    <tr key={t.id} className="ticket-group">
                      <td colSpan={6} style={{ padding: 0 }}>
                        {/* Summary row */}
                        <div
                          className={`ticket-row${isOpen ? " expanded" : ""}`}
                          onClick={() =>
                            setExpandedId(isOpen ? null : t.id)
                          }
                        >
                          <span className="col-ticket">#{t.id}</span>
                          <span className="col-subject">{t.subject}</span>
                          <span className="col-from">
                            {t.fromName ? `${t.fromName} ` : ""}
                            <span className="email-dim">{t.fromEmail}</span>
                          </span>
                          <span className="col-status">
                            <span
                              className={`badge badge-${st.toLowerCase()}`}
                            >
                              {st}
                            </span>
                          </span>
                          <span className="col-date">{t.createdAt}</span>
                          <span className="col-action">
                            <button
                              className="status-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(t.id);
                              }}
                              disabled={updatingId === t.id}
                            >
                              {updatingId === t.id
                                ? "..."
                                : st === "Open"
                                ? "Close"
                                : "Reopen"}
                            </button>
                          </span>
                        </div>

                        {/* Expanded message */}
                        {isOpen && (
                          <div className="ticket-detail">
                            <p className="detail-label">Message:</p>
                            <p className="detail-message">{t.message}</p>
                            <a
                              href={`mailto:${t.fromEmail}?subject=Re: ${encodeURIComponent(t.subject)} — Ticket #${t.id}`}
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
                    <td colSpan={6} className="table-message">
                      No support tickets
                      {filter !== "all" ? ` with status "${filter}"` : " yet"}.
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
        /* Filter bar */
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

        /* Table */
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

        /* Ticket rows */
        .ticket-row {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 80px 120px 80px;
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
        .col-ticket {
          font-weight: 500;
          font-size: 13px;
          color: #111827;
        }
        .col-subject {
          font-weight: 500;
        }
        .col-from {
          font-size: 13px;
        }
        .email-dim {
          color: #6b7280;
        }
        .col-date {
          font-size: 12px;
          color: #6b7280;
        }

        /* Badges */
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-open {
          background: #dcfce7;
          color: #166534;
        }
        .badge-closed {
          background: #f3f4f6;
          color: #6b7280;
        }
        /* Status button */
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

        /* Expanded detail */
        .ticket-detail {
          padding: 12px 20px 16px;
          background: #fafafa;
          border-top: 1px solid #e5e7eb;
        }
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
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

        /* Responsive */
        @media (max-width: 768px) {
          .ticket-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .col-ticket,
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
      .collection("supportTickets")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const tickets: Ticket[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        subject: d.subject || d.topic || "",
        fromName: d.fromName || d.name || "",
        fromEmail: d.fromEmail || d.email || "",
        message: d.message || "",
        status: d.status || "Open",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { tickets } };
  } catch (err) {
    console.error("Error loading support tickets", err);
    return { props: { tickets: [] } };
  }
};
