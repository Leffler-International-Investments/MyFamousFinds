import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  vipTier: string;
  points: number;
  createdAt: string;
  totalItems: number;
  totalSpent: number;
};

type Props = {
  customers: CustomerRow[];
};

function money(amount: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export default function ManagementCustomers({ customers: initial }: Props) {
  const { loading } = useRequireAdmin();
  const [customers, setCustomers] = useState<CustomerRow[]>(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteByEmail, setDeleteByEmail] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const onSuspendToggle = async (customer: CustomerRow) => {
    const isSuspended = customer.status === "Suspended";
    const nextStatus = isSuspended ? "Active" : "Suspended";

    const ok = window.confirm(
      `${isSuspended ? "Reactivate" : "Suspend"} customer?\n\n${customer.name} (${customer.email})\n\nProceed?`
    );
    if (!ok) return;

    setCustomers((prev) =>
      prev.map((r) => (r.id === customer.id ? { ...r, status: nextStatus } : r))
    );

    try {
      // When reactivating, also re-enable Firebase Auth (in case it was disabled)
      if (isSuspended && customer.email) {
        await fetch("/api/management/customers/enable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: customer.email }),
        });
      }

      const res = await fetch("/api/management/customers/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, status: nextStatus }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update customer status");
      }
    } catch (e) {
      setCustomers((prev) =>
        prev.map((r) => (r.id === customer.id ? { ...r, status: customer.status } : r))
      );
      alert("Could not update customer status. Check admin permissions.");
      console.error(e);
    }
  };

  const onDeleteCustomer = async (customer: CustomerRow) => {
    const ok = window.confirm(
      `DELETE customer permanently?\n\n${customer.name} (${customer.email})\nID: ${customer.id}\n\nThis cannot be undone.`
    );
    if (!ok) return;

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
      // Remove from local list if present
      setCustomers((prev) => prev.filter((c) => c.email.toLowerCase() !== email));
      alert(`Deleted.\nFirestore: ${json.deletedFirestore ? "Yes" : "No"}\nFirebase Auth: ${json.deletedAuth ? "Yes" : "No"}`);
      setDeleteByEmail("");
    } catch (e: any) {
      alert(e.message || "Could not delete customer.");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <div className="dashboard-page" />;

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
                View all registered customers. Suspend or delete accounts and
                see purchase activity at a glance.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="summary-row">
            <div className="summary-stat">
              <span className="summary-number">{customers.length}</span>
              <span className="summary-label">Total Customers</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">
                {customers.filter((c) => c.status === "Active").length}
              </span>
              <span className="summary-label">Active</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">
                {customers.filter((c) => c.status === "Suspended").length}
              </span>
              <span className="summary-label">Suspended</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">
                {money(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
              </span>
              <span className="summary-label">Total Revenue</span>
            </div>
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
              className="btn-delete-email"
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
            </select>
          </div>

          <div className="cards">
            {visible.length === 0 && (
              <div className="empty">No customers found.</div>
            )}

            {visible.map((c) => {
              const isExpanded = expandedId === c.id;
              const isSuspended = c.status === "Suspended";

              return (
                <div
                  key={c.id}
                  className={`card ${isSuspended ? "card-suspended" : ""}`}
                >
                  <div className="cardTop">
                    <div className="left">
                      <div className="kicker">CUSTOMER</div>
                      <div className="big">{c.name || "Unnamed"}</div>
                      <div className="sub">
                        <span
                          className={`pill ${isSuspended ? "pill-suspended" : ""}`}
                        >
                          {c.status}
                        </span>
                        {c.vipTier && c.vipTier !== "Member" && (
                          <span className="pill pill-vip">{c.vipTier}</span>
                        )}
                        <span className="muted">{c.createdAt}</span>
                      </div>
                    </div>

                    <div className="right">
                      <button
                        className="btn-expand"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : c.id)
                        }
                      >
                        {isExpanded ? "Collapse" : "View Card"}
                      </button>
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
                          <span className="detail-value">{c.createdAt}</span>
                        </div>
                      </div>

                      <div className="actions">
                        <button
                          type="button"
                          className={
                            isSuspended ? "btn-reactivate" : "btn-suspend"
                          }
                          onClick={() => onSuspendToggle(c)}
                        >
                          {isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => onDeleteCustomer(c)}
                        >
                          Delete
                        </button>
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
        .summary-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
        .btn-delete-email {
          border: 1px solid #dc2626;
          border-radius: 999px;
          background: #fee2e2;
          color: #b91c1c;
          padding: 8px 16px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        }
        .btn-delete-email:hover:not(:disabled) {
          background: #fecaca;
        }
        .btn-delete-email:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
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
          background: #0b1220;
          color: white;
          font-weight: 800;
          font-size: 11px;
        }
        .pill-suspended {
          background: #dc2626;
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
        .btn-expand {
          border: none;
          border-radius: 999px;
          background: #0b1220;
          color: #fff;
          padding: 8px 14px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-expand:hover {
          background: #1f2937;
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
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
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

        .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .btn-suspend {
          border: 1px solid #f59e0b;
          border-radius: 999px;
          background: #fffbeb;
          color: #92400e;
          padding: 8px 16px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-suspend:hover {
          background: #fef3c7;
        }
        .btn-reactivate {
          border: 1px solid #22c55e;
          border-radius: 999px;
          background: #f0fdf4;
          color: #166534;
          padding: 8px 16px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-reactivate:hover {
          background: #dcfce7;
        }
        .btn-delete {
          border: 1px solid #dc2626;
          border-radius: 999px;
          background: #fee2e2;
          color: #b91c1c;
          padding: 8px 16px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-delete:hover {
          background: #fecaca;
        }
        .empty {
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .summary-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .rowGrid {
            grid-template-columns: repeat(2, 1fr);
          }
          .detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .summary-row {
            grid-template-columns: 1fr;
          }
          .rowGrid {
            grid-template-columns: 1fr;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [usersSnap, ordersSnap] = await Promise.all([
      adminDb.collection("users").orderBy("createdAt", "desc").limit(500).get(),
      adminDb.collection("orders").get(),
    ]);

    // Aggregate order data by buyer email
    const ordersByEmail: Record<string, { items: number; spent: number }> = {};
    ordersSnap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      const buyerEmail = (d.buyer?.email || "").toLowerCase().trim();
      if (!buyerEmail) return;
      const total = Number(d.totals?.total || 0);
      if (!ordersByEmail[buyerEmail]) {
        ordersByEmail[buyerEmail] = { items: 0, spent: 0 };
      }
      ordersByEmail[buyerEmail].items += 1;
      ordersByEmail[buyerEmail].spent += total;
    });

    const customers: CustomerRow[] = usersSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const email = (d.email || "").toLowerCase().trim();
      const agg = ordersByEmail[email] || { items: 0, spent: 0 };

      return {
        id: doc.id,
        name: d.name || "",
        email: d.email || "",
        phone: d.phone || "",
        status: d.status || "Active",
        vipTier: d.vipTier || "Member",
        points: Number(d.points || 0),
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        totalItems: agg.items,
        totalSpent: agg.spent,
      };
    });

    return { props: { customers } };
  } catch (err) {
    console.error("Error loading customers", err);
    return { props: { customers: [] } };
  }
};
