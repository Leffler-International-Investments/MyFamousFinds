// FILE: /pages/management/vetting-queue.tsx

import { useMemo, useState } from "react";
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

type Props = { items: SellerApplication[] };

export default function ManagementVettingQueue({ items }: Props) {
  // Same guard as Listing Review Queue (no extra redirects)
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

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
    setEmailWarning(null);

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

      // Check if email was sent
      if (json.emailSent === false) {
        const seller = localItems.find((s) => s.id === id);
        const emailAddr = seller?.contactEmail || id;
        setEmailWarning(
          `Seller was ${action === "approve" ? "approved" : "rejected"}, but the notification email to ${emailAddr} failed to send. Please notify them manually.`
        );
      }

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
                New seller applications submitted via the "Become a Seller"
                form. Approve to grant access to the Seller Admin console, or
                reject with a reason.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to Management Dashboard
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

          {emailWarning && (
            <div
              className="form-message warning"
              style={{ marginBottom: "16px" }}
            >
              <strong>Warning:</strong> {emailWarning}
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
                      <td>{s.contactEmail || "—"}</td>
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
          background: #f3f4f6; /* gray-100 */
          color: #111827; /* gray-900 */
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
          color: #4b5563; /* gray-600 */
        }

        .btn-primary-dark {
          border-radius: 999px;
          background: #111827; /* gray-900 */
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
          background: #fee2e2; /* red-100 */
          color: #b91c1c; /* red-700 */
        }
        .form-message.warning {
          background: #fef3c7; /* amber-100 */
          color: #92400e; /* amber-800 */
        }

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
          border: 1px solid #d1d5db; /* gray-300 */
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
          background: #f9fafb; /* gray-50 */
        }

        .data-table th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #374151; /* gray-700 */
        }

        .data-table td {
          padding: 8px 12px;
          border-top: 1px solid #e5e7eb; /* gray-200 */
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
          background: #059669; /* green-600 */
          color: #ffffff;
        }

        .btn-reject {
          background: #dc2626; /* red-600 */
          color: #ffffff;
        }

        .btn-remove {
          background: #6b7280; /* gray-500 */
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
