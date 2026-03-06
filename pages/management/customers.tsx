import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string; // "Active" | "Suspended" | "Disabled"
  authDisabled: boolean;
  vipTier: string;
  points: number;
  createdAt: string;
  totalItems: number;
  totalSpent: number;
};

function money(amount: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(raw: string) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

export default function ManagementCustomers() {
  const { loading: adminLoading } = useRequireAdmin();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteByEmail, setDeleteByEmail] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreName, setRestoreName] = useState("");
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [addBuyerEmail, setAddBuyerEmail] = useState("");
  const [addBuyerName, setAddBuyerName] = useState("");
  const [addBuyerPassword, setAddBuyerPassword] = useState("");
  const [addBuyerBusy, setAddBuyerBusy] = useState(false);
  const [addBuyerResult, setAddBuyerResult] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setFetchState("loading");
    setFetchError(null);
    try {
      const res = await fetch("/api/management/customers/list");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setCustomers(json.customers || []);
      if (json.errors && json.errors.length > 0) {
        setFetchError(`Partial load — some sources failed: ${json.errors.join("; ")}`);
      }
      setFetchState("done");
    } catch (e: any) {
      console.error("[CUSTOMERS] fetch error:", e);
      setFetchError(e?.message || "Failed to load customers");
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    if (!adminLoading) {
      loadCustomers();
    }
  }, [adminLoading, loadCustomers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, query, statusFilter]);

  const markBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const onActivate = async (customer: CustomerRow) => {
    const ok = window.confirm(
      `Activate customer?\n\n${customer.name || customer.email}\n\nThis will re-enable their account and allow sign-in.`
    );
    if (!ok) return;

    markBusy(customer.id, true);
    const prevStatus = customer.status;
    setCustomers((prev) =>
      prev.map((r) => (r.id === customer.id ? { ...r, status: "Active", authDisabled: false } : r))
    );

    try {
      if (customer.email) {
        await fetch("/api/management/customers/enable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: customer.email }),
        });
      }

      const res = await fetch("/api/management/customers/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, status: "Active" }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to activate customer");
      }
    } catch (e) {
      setCustomers((prev) =>
        prev.map((r) => (r.id === customer.id ? { ...r, status: prevStatus, authDisabled: customer.authDisabled } : r))
      );
      alert("Could not activate customer. Check admin permissions.");
      console.error(e);
    } finally {
      markBusy(customer.id, false);
    }
  };

  const onDisable = async (customer: CustomerRow) => {
    const ok = window.confirm(
      `Disable customer?\n\n${customer.name || customer.email}\n\nThis will suspend their account and prevent sign-in.`
    );
    if (!ok) return;

    markBusy(customer.id, true);
    setCustomers((prev) =>
      prev.map((r) => (r.id === customer.id ? { ...r, status: "Suspended" } : r))
    );

    try {
      const res = await fetch("/api/management/customers/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, status: "Suspended" }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to disable customer");
      }
    } catch (e) {
      setCustomers((prev) =>
        prev.map((r) => (r.id === customer.id ? { ...r, status: customer.status } : r))
      );
      alert("Could not disable customer. Check admin permissions.");
      console.error(e);
    } finally {
      markBusy(customer.id, false);
    }
  };

  const onDeleteCustomer = async (customer: CustomerRow) => {
    const ok = window.confirm(
      `DELETE customer permanently?\n\n${customer.name || "Unnamed"} (${customer.email})\nID: ${customer.id}\n\nThis removes them from Firestore AND Firebase Auth.\nThis cannot be undone.`
    );
    if (!ok) return;

    markBusy(customer.id, true);
    const snapshot = customers;
    setCustomers((prev) => prev.filter((r) => r.id !== customer.id));

    try {
      const res = await fetch("/api/management/customers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to delete customer");
      }
    } catch (e) {
      setCustomers(snapshot);
      alert("Could not delete customer. Check admin permissions.");
      console.error(e);
    } finally {
      markBusy(customer.id, false);
    }
  };

  const onDeleteByEmail = async () => {
    const email = deleteByEmail.trim().toLowerCase();
    if (!email) return;
    if (!window.confirm(`Delete customer "${email}" from Firebase Auth + Firestore?\n\nThis allows them to re-register from scratch.`)) return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/management/customers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setCustomers((prev) => prev.filter((c) => c.email.toLowerCase() !== email));
      alert(`Deleted.\nFirestore: ${json.deletedFirestore ? "Yes" : "No"}\nFirebase Auth: ${json.deletedAuth ? "Yes" : "No"}`);
      setDeleteByEmail("");
    } catch (e: any) {
      alert(e.message || "Could not delete customer.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const onRestoreByEmail = async () => {
    const email = restoreEmail.trim().toLowerCase();
    if (!email) return;
    setRestoreBusy(true);
    setRestoreResult(null);
    try {
      const res = await fetch("/api/management/customers/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: restoreName.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to restore");
      setRestoreResult(json.message || "Account restored successfully.");
      setRestoreEmail("");
      setRestoreName("");
      // Refresh the customer list to show the restored user
      loadCustomers();
    } catch (e: any) {
      setRestoreResult(`Error: ${e.message || "Could not restore account."}`);
    } finally {
      setRestoreBusy(false);
    }
  };

  const onAddBuyer = async () => {
    const email = addBuyerEmail.trim().toLowerCase();
    if (!email) return;
    setAddBuyerBusy(true);
    setAddBuyerResult(null);
    try {
      const res = await fetch("/api/management/customers/add-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: addBuyerName.trim() || undefined,
          password: addBuyerPassword.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add buyer");
      setAddBuyerResult(json.message || "Buyer added successfully.");
      setAddBuyerEmail("");
      setAddBuyerName("");
      setAddBuyerPassword("");
      loadCustomers();
    } catch (e: any) {
      setAddBuyerResult(`Error: ${e.message || "Could not add buyer."}`);
    } finally {
      setAddBuyerBusy(false);
    }
  };

  if (adminLoading) return <div className="dashboard-page" />;

  const countActive = customers.filter((c) => c.status === "Active").length;
  const countSuspended = customers.filter((c) => c.status === "Suspended").length;
  const countDisabled = customers.filter((c) => c.status === "Disabled").length;

  return (
    <>
      <Head>
        <title>Customer Register — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Customer Register</h1>
              <p>
                View all registered buyers. Activate, disable, or delete accounts
                and see purchase activity at a glance.
              </p>
            </div>
            <Link href="/management/dashboard">
              &larr; Back to Management Dashboard
            </Link>
          </div>

          {/* Error / loading banner */}
          {fetchState === "loading" && (
            <div className="status-banner status-loading">Loading buyers from Firebase...</div>
          )}
          {fetchState === "error" && (
            <div className="status-banner status-error">
              <span>Failed to load customers: {fetchError}</span>
              <button className="btn-retry" onClick={loadCustomers}>Retry</button>
            </div>
          )}
          {fetchError && fetchState === "done" && (
            <div className="status-banner status-warn">{fetchError}</div>
          )}

          <div className="summary-row">
            <div className="summary-stat">
              <span className="summary-number">{customers.length}</span>
              <span className="summary-label">Total Customers</span>
            </div>
            <div className="summary-stat summary-active">
              <span className="summary-number">{countActive}</span>
              <span className="summary-label">Active</span>
            </div>
            <div className="summary-stat summary-suspended">
              <span className="summary-number">{countSuspended}</span>
              <span className="summary-label">Suspended</span>
            </div>
            <div className="summary-stat summary-disabled">
              <span className="summary-number">{countDisabled}</span>
              <span className="summary-label">Disabled</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">
                {money(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
              </span>
              <span className="summary-label">Total Revenue</span>
            </div>
          </div>

          <div className="add-buyer-bar">
            <span className="add-buyer-label">Add New Buyer:</span>
            <input
              className="form-input"
              placeholder="Email (required)"
              value={addBuyerEmail}
              onChange={(e) => setAddBuyerEmail(e.target.value)}
              style={{ maxWidth: 250 }}
            />
            <input
              className="form-input"
              placeholder="Name (optional)"
              value={addBuyerName}
              onChange={(e) => setAddBuyerName(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <input
              className="form-input"
              type="password"
              placeholder="Password (optional)"
              value={addBuyerPassword}
              onChange={(e) => setAddBuyerPassword(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <button
              className="btn-action btn-action-add"
              disabled={addBuyerBusy || !addBuyerEmail.trim()}
              onClick={onAddBuyer}
            >
              {addBuyerBusy ? "Adding..." : "+ Add Buyer"}
            </button>
            {addBuyerResult && (
              <div className={`add-buyer-result ${addBuyerResult.startsWith("Error") ? "add-buyer-error" : "add-buyer-success"}`}>
                {addBuyerResult}
              </div>
            )}
          </div>

          <div className="restore-bar">
            <span className="restore-label">Restore deleted/disabled account by email:</span>
            <input
              className="form-input"
              placeholder="e.g. leffleryd@gmail.com"
              value={restoreEmail}
              onChange={(e) => setRestoreEmail(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <input
              className="form-input"
              placeholder="Name (optional)"
              value={restoreName}
              onChange={(e) => setRestoreName(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <button
              className="btn-action btn-action-activate"
              disabled={restoreBusy || !restoreEmail.trim()}
              onClick={onRestoreByEmail}
            >
              {restoreBusy ? "Restoring..." : "Restore Account"}
            </button>
            {restoreResult && (
              <div className={`restore-result ${restoreResult.startsWith("Error") ? "restore-error" : "restore-success"}`}>
                {restoreResult}
              </div>
            )}
          </div>

          <div className="delete-by-email-bar">
            <span className="delete-label">Delete customer by email (even if not listed):</span>
            <input
              className="form-input"
              placeholder="e.g. jaffaleffler@gmail.com"
              value={deleteByEmail}
              onChange={(e) => setDeleteByEmail(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <button
              className="btn-action btn-action-delete"
              disabled={deleteBusy || !deleteByEmail.trim()}
              onClick={onDeleteByEmail}
            >
              {deleteBusy ? "Deleting..." : "Delete & Allow Re-register"}
            </button>
          </div>

          <div className="filters-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone, or ID..."
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: 200 }}
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Disabled">Disabled</option>
            </select>
            <button className="btn-refresh" onClick={loadCustomers} disabled={fetchState === "loading"}>
              {fetchState === "loading" ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="cards">
            {fetchState === "done" && visible.length === 0 && (
              <div className="empty">No customers found.</div>
            )}

            {visible.map((c) => {
              const isExpanded = expandedId === c.id;
              const isActive = c.status === "Active";
              const isBusy = busyIds.has(c.id);

              return (
                <div
                  key={c.id}
                  className={`card ${c.status === "Suspended" ? "card-suspended" : ""} ${c.status === "Disabled" ? "card-disabled" : ""}`}
                >
                  <div className="cardTop">
                    <div className="left">
                      <div className="kicker">BUYER</div>
                      <div className="big">{c.name || "Unnamed"}</div>
                      <div className="sub">
                        <span
                          className={`pill ${c.status === "Suspended" ? "pill-suspended" : ""} ${c.status === "Disabled" ? "pill-disabled" : ""}`}
                        >
                          {c.status}
                        </span>
                        {c.vipTier && c.vipTier !== "Member" && (
                          <span className="pill pill-vip">{c.vipTier}</span>
                        )}
                        <span className="muted">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>

                    <div className="right">
                      <div className="card-actions">
                        {isActive ? (
                          <button
                            type="button"
                            className="btn-action btn-action-disable"
                            disabled={isBusy}
                            onClick={() => onDisable(c)}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-action btn-action-activate"
                            disabled={isBusy}
                            onClick={() => onActivate(c)}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-action btn-action-delete"
                          disabled={isBusy}
                          onClick={() => onDeleteCustomer(c)}
                        >
                          Delete
                        </button>
                        <button
                          className="btn-expand"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : c.id)
                          }
                        >
                          {isExpanded ? "Collapse" : "Details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rowGrid">
                    <div className="box">
                      <div className="label">Email</div>
                      <div className="value">{c.email || "—"}</div>
                    </div>
                    <div className="box">
                      <div className="label">Phone</div>
                      <div className="value">{c.phone || "—"}</div>
                    </div>
                    <div className="box box-highlight">
                      <div className="label">Items Purchased</div>
                      <div className="value value-big">
                        {c.totalItems.toLocaleString("en-US")}
                      </div>
                    </div>
                    <div className="box box-highlight">
                      <div className="label">Total Spent ($)</div>
                      <div className="value value-big">{money(c.totalSpent)}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="cardBody">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Customer ID</span>
                          <span className="detail-value">{c.id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">VIP Tier</span>
                          <span className="detail-value">
                            {c.vipTier || "Member"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Points</span>
                          <span className="detail-value">
                            {c.points.toLocaleString("en-US")}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Registered</span>
                          <span className="detail-value">{formatDate(c.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Auth Status</span>
                          <span className="detail-value">
                            {c.authDisabled ? "Disabled in Firebase" : "Enabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .status-banner {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .status-loading {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }
        .status-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .status-warn {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        .btn-retry {
          border: 1px solid #b91c1c;
          border-radius: 8px;
          background: #fff;
          color: #b91c1c;
          padding: 6px 14px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap;
        }
        .btn-retry:hover {
          background: #fee2e2;
        }
        .btn-refresh {
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          color: #374151;
          padding: 8px 16px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .btn-refresh:hover:not(:disabled) {
          background: #e5e7eb;
        }
        .btn-refresh:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .summary-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-stat {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .summary-active {
          border-color: #bbf7d0;
          background: #f0fdf4;
        }
        .summary-suspended {
          border-color: #fca5a5;
          background: #fef2f2;
        }
        .summary-disabled {
          border-color: #d1d5db;
          background: #f3f4f6;
        }
        .summary-number {
          font-size: 22px;
          font-weight: 900;
          color: #0b1220;
        }
        .summary-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }

        .restore-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          padding: 12px 14px;
          background: #f0fdf4;
          border: 1px solid #16a34a;
          border-radius: 10px;
        }
        .restore-label {
          font-size: 13px;
          font-weight: 700;
          color: #15803d;
        }
        .restore-result {
          width: 100%;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          margin-top: 4px;
        }
        .restore-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .restore-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .add-buyer-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          padding: 12px 14px;
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 10px;
        }
        .add-buyer-label {
          font-size: 13px;
          font-weight: 700;
          color: #1d4ed8;
        }
        .btn-action-add {
          border: 1.5px solid #3b82f6;
          background: #1d4ed8;
          color: #fff;
        }
        .btn-action-add:hover:not(:disabled) {
          background: #1e40af;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
        }
        .add-buyer-result {
          width: 100%;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          margin-top: 4px;
        }
        .add-buyer-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .add-buyer-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .delete-by-email-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          padding: 12px 14px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 10px;
        }
        .delete-label {
          font-size: 13px;
          font-weight: 700;
          color: #92400e;
        }

        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .form-input {
          width: 100%;
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

        .cards {
          display: grid;
          gap: 12px;
        }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .card-suspended {
          border-color: #fca5a5;
          background: #fef2f2;
        }
        .card-disabled {
          border-color: #9ca3af;
          background: #f9fafb;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .kicker {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #6b7280;
          font-weight: 800;
        }
        .big {
          font-size: 16px;
          font-weight: 900;
          color: #0b1220;
        }
        .sub {
          margin-top: 6px;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pill {
          display: inline-flex;
          padding: 3px 10px;
          border-radius: 999px;
          background: #16a34a;
          color: white;
          font-weight: 800;
          font-size: 11px;
        }
        .pill-suspended {
          background: #dc2626;
        }
        .pill-disabled {
          background: #6b7280;
        }
        .pill-vip {
          background: #b45309;
        }
        .muted {
          color: #6b7280;
          font-size: 12px;
        }
        .right {
          display: flex;
          align-items: flex-start;
        }

        .card-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-action {
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .btn-action:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .btn-action-activate {
          border: 1.5px solid #16a34a;
          background: #f0fdf4;
          color: #15803d;
        }
        .btn-action-activate:hover:not(:disabled) {
          background: #dcfce7;
          box-shadow: 0 1px 3px rgba(22, 163, 74, 0.2);
        }
        .btn-action-disable {
          border: 1.5px solid #f59e0b;
          background: #fffbeb;
          color: #b45309;
        }
        .btn-action-disable:hover:not(:disabled) {
          background: #fef3c7;
          box-shadow: 0 1px 3px rgba(245, 158, 11, 0.2);
        }
        .btn-action-delete {
          border: 1.5px solid #dc2626;
          background: #fef2f2;
          color: #b91c1c;
        }
        .btn-action-delete:hover:not(:disabled) {
          background: #fee2e2;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.2);
        }

        .btn-expand {
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          color: #374151;
          padding: 8px 14px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .btn-expand:hover {
          background: #e5e7eb;
        }

        .rowGrid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .box {
          border: 1px solid #eef2f7;
          border-radius: 12px;
          padding: 10px;
          background: #fafafa;
        }
        .box-highlight {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 800;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .value {
          font-size: 13px;
          font-weight: 700;
          color: #0b1220;
          word-break: break-all;
        }
        .value-big {
          font-size: 18px;
          font-weight: 900;
        }

        .cardBody {
          margin-top: 14px;
          border-top: 1px solid #eef2f7;
          padding-top: 14px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-value {
          font-size: 13px;
          font-weight: 700;
          color: #0b1220;
          word-break: break-all;
        }

        .empty {
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .summary-row {
            grid-template-columns: repeat(3, 1fr);
          }
          .rowGrid {
            grid-template-columns: repeat(2, 1fr);
          }
          .detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .card-actions {
            gap: 4px;
          }
          .btn-action, .btn-expand {
            padding: 6px 10px;
            font-size: 12px;
          }
        }
        @media (max-width: 600px) {
          .summary-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .rowGrid {
            grid-template-columns: 1fr;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .cardTop {
            flex-direction: column;
          }
          .card-actions {
            margin-top: 8px;
          }
        }
      `}</style>
    </>
  );
}
