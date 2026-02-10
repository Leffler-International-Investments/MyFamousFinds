// FILE: /pages/management/email-queue.tsx
// Admin page to view and manage the email outbox

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type EmailJobStatus = "pending" | "sent" | "failed" | "dead";

type EmailJob = {
  id: string;
  to: string;
  subject: string;
  status: EmailJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  eventType: string;
  createdAt: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  sentAt?: string;
};

type Stats = Record<EmailJobStatus, number>;

export default function EmailQueuePage() {
  const { loading: authLoading } = useRequireAdmin();
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, sent: 0, failed: 0, dead: 0 });
  const [filter, setFilter] = useState<EmailJobStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchEmails() {
    setLoading(true);
    try {
      const url = filter === "all"
        ? "/api/admin/email-queue"
        : `/api/admin/email-queue?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setEmails(data.emails);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchEmails();
    }
  }, [authLoading, filter]);

  async function handleProcessQueue() {
    setProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-queue/process", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage({
          type: "success",
          text: `Processed ${data.processed} emails: ${data.sent} sent, ${data.failed} failed`,
        });
        fetchEmails();
      } else {
        setMessage({ type: "error", text: data.errors?.join(", ") || "Failed to process queue" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to process queue" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleRetry(jobId: string) {
    setActionLoading(jobId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-queue/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Email queued for retry" });
        fetchEmails();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to retry" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to retry" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(jobId: string) {
    if (!confirm("Delete this email job?")) return;
    setActionLoading(jobId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-queue/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Email deleted" });
        fetchEmails();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete" });
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  }

  function getStatusBadge(status: EmailJobStatus) {
    const colors: Record<EmailJobStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      dead: "bg-gray-800 text-white",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  if (authLoading) {
    return <div className="dashboard-page" />;
  }

  return (
    <>
      <Head>
        <title>Email Queue — Management Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Email Queue</h1>
              <p>View and manage outbound emails. Failed emails are automatically retried.</p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.sent}</div>
              <div className="stat-label">Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.failed + stats.dead}</div>
              <div className="stat-label">Failed/Dead</div>
            </div>
          </div>

          {/* Actions */}
          <div className="actions-bar">
            <button
              className="btn-primary"
              onClick={handleProcessQueue}
              disabled={processing}
            >
              {processing ? "Processing..." : "Process Queue Now"}
            </button>
            <button className="btn-secondary" onClick={fetchEmails} disabled={loading}>
              Refresh
            </button>
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Emails</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="dead">Dead Letter</option>
            </select>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Last Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>Loading...</td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>No emails found</td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id}>
                      <td>{email.to}</td>
                      <td className="subject-cell" title={email.subject}>
                        {email.subject.slice(0, 40)}{email.subject.length > 40 ? "..." : ""}
                      </td>
                      <td>{email.eventType}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(email.status)}`}>
                          {email.status}
                        </span>
                      </td>
                      <td>{email.attempts}/{email.maxAttempts}</td>
                      <td>{formatDate(email.createdAt)}</td>
                      <td className="error-cell" title={email.lastError || ""}>
                        {email.lastError ? email.lastError.slice(0, 30) + "..." : "—"}
                      </td>
                      <td>
                        <div className="actions-cell">
                          {(email.status === "failed" || email.status === "dead") && (
                            <button
                              className="btn-small btn-retry"
                              onClick={() => handleRetry(email.id)}
                              disabled={actionLoading === email.id}
                            >
                              Retry
                            </button>
                          )}
                          <button
                            className="btn-small btn-delete"
                            onClick={() => handleDelete(email.id)}
                            disabled={actionLoading === email.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f3f4f6;
          color: #111827;
          display: flex;
          flex-direction: column;
        }
        .dashboard-main {
          flex: 1;
          padding: 24px 16px 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }
        .dashboard-header h1 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .dashboard-header p {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
        }
        .btn-primary-dark {
          border-radius: 999px;
          background: #111827;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-decoration: none;
          border: none;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }
        .stat-label {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }
        .actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }
        .btn-primary {
          background: #059669;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .filter-select {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          margin-left: auto;
        }
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .message.success {
          background: #d1fae5;
          color: #065f46;
        }
        .message.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .table-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          padding: 12px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .subject-cell, .error-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .bg-yellow-100 { background: #fef3c7; }
        .text-yellow-800 { color: #92400e; }
        .bg-green-100 { background: #d1fae5; }
        .text-green-800 { color: #065f46; }
        .bg-red-100 { background: #fee2e2; }
        .text-red-800 { color: #991b1b; }
        .bg-gray-800 { background: #1f2937; }
        .actions-cell {
          display: flex;
          gap: 6px;
        }
        .btn-small {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          border: none;
          cursor: pointer;
        }
        .btn-small:disabled {
          opacity: 0.5;
        }
        .btn-retry {
          background: #dbeafe;
          color: #1e40af;
        }
        .btn-delete {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </>
  );
}
