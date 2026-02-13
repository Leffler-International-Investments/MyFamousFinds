// FILE: /pages/management/vetting-queue.tsx

import { useCallback, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type SellerApplication = {
  id: string;
  businessName: string;
  contactEmail: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected" | "Removed";
};

type ManualNotifyInfo = {
  sellerId: string;
  sellerEmail: string;
  businessName: string;
  decision: "approved" | "rejected";
  reason?: string;
};

type Props = { items: SellerApplication[] };

const BCC_ADDRESSES = "leffleryd@gmail.com,admin@myfamousfinds.com";

function buildGmailComposeUrl(info: ManualNotifyInfo): string {
  const to = encodeURIComponent(info.sellerEmail);
  const bcc = encodeURIComponent(BCC_ADDRESSES);

  let subject: string;
  let body: string;

  if (info.decision === "approved") {
    subject = encodeURIComponent(
      "Famous Finds — Your Seller Account Has Been Approved!"
    );
    body = encodeURIComponent(
      `Hello${info.businessName ? " " + info.businessName : ""},\n\n` +
        `Great news — your seller account on Famous Finds has been approved!\n\n` +
        `Login here - https://www.myfamousfinds.com/seller/login and complete the registration process.\n\n` +
        `Welcome aboard!\nThe Famous Finds Team`
    );
  } else {
    const reasonLine =
      info.reason ? `\n\nFeedback: ${info.reason}` : "";
    subject = encodeURIComponent(
      "Famous Finds — Seller Application Update"
    );
    body = encodeURIComponent(
      `Hello${info.businessName ? " " + info.businessName : ""},\n\n` +
        `Thank you for your interest in becoming a seller on Famous Finds.\n\n` +
        `After reviewing your application, we are unable to approve it at this time.${reasonLine}\n\n` +
        `You are welcome to re-apply in the future.\n\n` +
        `Regards,\nThe Famous Finds Team`
    );
  }

  return `https://mail.google.com/mail/?view=cm&to=${to}&bcc=${bcc}&su=${subject}&body=${body}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ManagementVettingQueue({ items }: Props) {
  // Same guard as Listing Review Queue (no extra redirects)
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual notification panel state
  const [manualNotify, setManualNotify] = useState<ManualNotifyInfo | null>(
    null
  );
  const [notifyLogging, setNotifyLogging] = useState(false);
  const [notifyLogged, setNotifyLogged] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localItems;

    return localItems.filter((s) => {
      const haystack = [
        s.businessName,
        s.contactEmail,
        s.id,
        s.status,
        s.submittedAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, localItems]);

  const handleCopy = useCallback(
    async (text: string, field: string) => {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      }
    },
    []
  );

  async function handleAction(
    id: string,
    action: "approve" | "reject"
  ): Promise<void> {
    if (actionLoading) return;

    if (action === "approve") {
      const ok = window.confirm(
        "Approve this seller? They will be able to log in to the Seller Admin console."
      );
      if (!ok) return;
    }

    let reason: string | undefined;
    if (action === "reject") {
      const input = window.prompt(
        "Add a short note for the seller explaining why the application was rejected (optional):",
        ""
      );
      if (input === null) {
        // User cancelled the dialog
        return;
      }
      reason = input.trim() || undefined;
    }

    setActionLoading(id);
    setError(null);
    setManualNotify(null);
    setNotifyLogged(false);

    try {
      // Uses the same pattern you had: /api/admin/approve-seller / reject-seller
      const res = await fetch(`/api/admin/${action}-seller/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: action === "reject" ? reason : undefined,
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update seller");
      }

      const seller = localItems.find((s) => s.id === id);
      const emailAddr = seller?.contactEmail || id;
      const businessName = seller?.businessName || "";

      // Always show manual notification panel — we are running manual operations
      setManualNotify({
        sellerId: id,
        sellerEmail: emailAddr,
        businessName,
        decision: action === "approve" ? "approved" : "rejected",
        reason,
      });

      // Update local list
      setLocalItems((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: action === "approve" ? "Approved" : "Rejected",
              }
            : s
        )
      );
    } catch (err: any) {
      console.error("vetting_queue_action_error", err);
      setError(err?.message || "Something went wrong updating this seller.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkNotified() {
    if (!manualNotify || notifyLogging) return;
    setNotifyLogging(true);

    try {
      const res = await fetch("/api/admin/log-manual-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: manualNotify.sellerId,
          sellerEmail: manualNotify.sellerEmail,
          decision: manualNotify.decision,
          sentBy: "staff",
        }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to log notification");
      }
      setNotifyLogged(true);
    } catch (err: any) {
      console.error("log_manual_notification_error", err);
      setError(
        err?.message || "Failed to log manual notification. Try again."
      );
    } finally {
      setNotifyLogging(false);
    }
  }

  async function handleRemove(id: string) {
    if (actionLoading) return;

    const ok = window.confirm(
      "REMOVE this seller/application?\n\nThis will:\n- mark the seller as Removed\n- hide their listings (status = Removed)\n\nProceed?"
    );
    if (!ok) return;

    const reason =
      window.prompt(
        "Optional: add a short reason for removal (saved in Firebase):",
        ""
      ) ?? null;
    if (reason === null) return; // user cancelled

    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/remove-seller/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to remove seller");
      }

      // Remove from the queue UI immediately
      setLocalItems((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error("vetting_queue_remove_error", err);
      setError(err?.message || "Something went wrong removing this seller.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    // Same skeleton pattern as other admin pages
    return <div className="dashboard-page" />;
  }

  const hasAny = visible.length > 0;

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Management Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>Seller Vetting Queue</h1>
              <p>
                New seller applications submitted via the &quot;Become a
                Seller&quot; form. Approve to grant access to the Seller Admin
                console, or reject with a reason.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              &larr; Back to Management Dashboard
            </Link>
          </div>

          {error && (
            <div
              className="form-message error"
              style={{ marginBottom: "16px" }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* ── Manual Notification Panel ── */}
          {manualNotify && (
            <div className="manual-notify-panel">
              <div className="manual-notify-header">
                <strong>
                  Manual Notification Required
                </strong>
                <button
                  className="btn-dismiss"
                  onClick={() => {
                    setManualNotify(null);
                    setNotifyLogged(false);
                  }}
                  title="Dismiss"
                >
                  &times;
                </button>
              </div>

              <p className="manual-notify-sub">
                Automated email is unreliable. Send a manual Gmail to the seller
                now, then mark as notified for the audit trail.
              </p>

              {/* Seller email with copy */}
              <div className="notify-field">
                <label>Seller email:</label>
                <span className="notify-value">
                  {manualNotify.sellerEmail}
                </span>
                <button
                  className="btn-copy"
                  onClick={() =>
                    handleCopy(manualNotify.sellerEmail, "email")
                  }
                >
                  {copiedField === "email" ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Decision */}
              <div className="notify-field">
                <label>Decision:</label>
                <span
                  className={`notify-badge ${manualNotify.decision === "approved" ? "badge-approved" : "badge-rejected"}`}
                >
                  {manualNotify.decision === "approved"
                    ? "APPROVED"
                    : "REJECTED"}
                </span>
              </div>

              {/* Login link (approval only) */}
              {manualNotify.decision === "approved" && (
                  <div className="notify-field">
                    <label>Login link:</label>
                    <span className="notify-value notify-url">
                      https://www.myfamousfinds.com/seller/login
                    </span>
                    <button
                      className="btn-copy"
                      onClick={() =>
                        handleCopy("https://www.myfamousfinds.com/seller/login", "url")
                      }
                    >
                      {copiedField === "url" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}

              {/* Rejection reason (if given) */}
              {manualNotify.decision === "rejected" &&
                manualNotify.reason && (
                  <div className="notify-field">
                    <label>Reason:</label>
                    <span className="notify-value">
                      {manualNotify.reason}
                    </span>
                  </div>
                )}

              {/* Checklist */}
              <div className="notify-checklist">
                <p>
                  <strong>Include in your email:</strong>
                </p>
                <ul>
                  <li>
                    Decision ({manualNotify.decision})
                  </li>
                  {manualNotify.decision === "approved" && (
                    <li>Login link (above)</li>
                  )}
                  <li>Next steps for the seller</li>
                  <li>
                    BCC: {BCC_ADDRESSES} (for audit trail)
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="notify-actions">
                <a
                  className="btn-gmail"
                  href={buildGmailComposeUrl(manualNotify)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Gmail Compose
                </a>

                {notifyLogged ? (
                  <span className="notify-logged-badge">
                    Logged as manually notified
                  </span>
                ) : (
                  <button
                    className="btn-mark-notified"
                    onClick={handleMarkNotified}
                    disabled={notifyLogging}
                  >
                    {notifyLogging
                      ? "Logging..."
                      : "Mark as Manually Notified"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card-header">
            <div className="card-title">Applications</div>
            <input
              type="text"
              placeholder="Search by business, email or ID…"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ width: "320px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hasAny ? (
                  visible.map((s) => (
                    <tr key={s.id}>
                      <td>{s.businessName || "—"}</td>
                      <td>
                        <span className="email-cell">
                          {s.contactEmail || "—"}
                          {s.contactEmail && (
                            <button
                              className="btn-copy-inline"
                              onClick={() =>
                                handleCopy(s.contactEmail, `row-${s.id}`)
                              }
                              title="Copy email"
                            >
                              {copiedField === `row-${s.id}`
                                ? "Copied"
                                : "Copy"}
                            </button>
                          )}
                        </span>
                      </td>
                      <td>{s.submittedAt || "—"}</td>
                      <td>{s.status}</td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn-small btn-approve"
                            disabled={
                              actionLoading === s.id || s.status === "Approved"
                            }
                            onClick={() => handleAction(s.id, "approve")}
                          >
                            {actionLoading === s.id &&
                            s.status !== "Approved"
                              ? "Approving…"
                              : "Approve"}
                          </button>
                          <button
                            className="btn-small btn-reject"
                            disabled={
                              actionLoading === s.id || s.status === "Rejected"
                            }
                            onClick={() => handleAction(s.id, "reject")}
                          >
                            {actionLoading === s.id &&
                            s.status !== "Rejected"
                              ? "Rejecting…"
                              : "Reject"}
                          </button>

                          <button
                            className="btn-small btn-remove"
                            disabled={actionLoading === s.id}
                            onClick={() => handleRemove(s.id)}
                            title="Remove seller/application"
                          >
                            {actionLoading === s.id ? "Working…" : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>
                      No applications found yet.
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
          max-width: 1120px;
          margin: 0 auto;
          width: 100%;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
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
          flex-shrink: 0;
        }

        .form-message {
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .form-message.error {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* ── Manual Notification Panel ── */
        .manual-notify-panel {
          background: #fffbeb;
          border: 2px solid #f59e0b;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }

        .manual-notify-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 15px;
          color: #92400e;
        }

        .btn-dismiss {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #92400e;
          padding: 0 4px;
          line-height: 1;
        }

        .manual-notify-sub {
          font-size: 13px;
          color: #78350f;
          margin: 0 0 12px;
        }

        .notify-field {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .notify-field label {
          font-weight: 600;
          color: #78350f;
          min-width: 120px;
          flex-shrink: 0;
        }

        .notify-value {
          color: #111827;
          word-break: break-all;
        }

        .notify-url {
          font-family: monospace;
          font-size: 12px;
          background: #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
          max-width: 500px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
        }

        .notify-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .badge-approved {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-copy {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          cursor: pointer;
          color: #374151;
          flex-shrink: 0;
        }
        .btn-copy:hover {
          background: #f3f4f6;
        }

        .notify-checklist {
          margin: 12px 0;
          font-size: 13px;
          color: #78350f;
        }

        .notify-checklist p {
          margin: 0 0 4px;
        }

        .notify-checklist ul {
          margin: 0;
          padding-left: 20px;
        }

        .notify-checklist li {
          margin-bottom: 2px;
        }

        .notify-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .btn-gmail {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #1d4ed8;
          color: #ffffff;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .btn-gmail:hover {
          background: #1e40af;
        }

        .btn-mark-notified {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #059669;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-mark-notified:hover {
          background: #047857;
        }
        .btn-mark-notified:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .notify-logged-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: #d1fae5;
          color: #065f46;
        }

        /* ── Email cell inline copy ── */
        .email-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-copy-inline {
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          cursor: pointer;
          color: #6b7280;
          flex-shrink: 0;
        }
        .btn-copy-inline:hover {
          background: #e5e7eb;
          color: #374151;
        }

        /* ── Existing table styles ── */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }
        .card-title {
          font-weight: 600;
          font-size: 16px;
        }

        .search-input {
          max-width: 260px;
          width: 100%;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 13px;
          background: #ffffff;
        }

        .table-wrapper {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
          padding: 12px;
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
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

        .data-table td {
          padding: 8px 12px;
          border-top: 1px solid #e5e7eb;
        }

        .data-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        .actions-cell {
          display: flex;
          gap: 6px;
        }

        .btn-small {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: none;
          cursor: pointer;
        }

        .btn-small[disabled] {
          opacity: 0.6;
          cursor: default;
        }

        .btn-approve {
          background: #059669;
          color: #ffffff;
        }

        .btn-reject {
          background: #dc2626;
          color: #ffffff;
        }

        .btn-remove {
          background: #6b7280;
          color: #ffffff;
        }
      `}</style>
    </>
  );
}

// Load applications from the "sellers" collection (same as your existing code)
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const snapshot = await adminDb
    .collection("sellers")
    .orderBy("submittedAt", "desc")
    .limit(200)
    .get();

  const items: SellerApplication[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      businessName: data.businessName || "",
      contactEmail: data.contactEmail || data.email || "",
      submittedAt: data.submittedAt
        ? new Date(data.submittedAt.toDate()).toLocaleString()
        : "",
      status: (data.status as any) || "Pending",
    };
  });

  return {
    props: {
      items,
    },
  };
};
