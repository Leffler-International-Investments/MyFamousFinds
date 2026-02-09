// FILE: /pages/management/sellers.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { mgmtFetch } from "../../utils/managementClient";

type SellerRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  totalListings: number;
  createdAt: string;
};

type Props = {
  sellers: SellerRow[];
};

export default function ManagementSellers({ sellers }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");

  // NEW: optimistic UI state (so you don't need a full refresh)
  const [rows, setRows] = useState<SellerRow[]>(sellers);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => {
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.id || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  // NEW: Disable/Enable seller (updates sellers/{sellerId}.status)
  const onToggleDisable = async (seller: SellerRow) => {
    const isDisabled = (seller.status || "").toLowerCase() === "disabled";
    const nextStatus = isDisabled ? "Active" : "Disabled";

    const ok = window.confirm(
      `${isDisabled ? "Enable" : "Disable"} seller:\n\n${seller.name} (${seller.email})\n\nProceed?`
    );
    if (!ok) return;

    // optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === seller.id ? { ...r, status: nextStatus } : r))
    );

    try {
      // Use API route so this works even if Firestore client is locked down.
      const res = await mgmtFetch("/api/admin/sellers/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: seller.id, status: nextStatus }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update seller status");
      }
    } catch (e) {
      // rollback on error
      setRows((prev) =>
        prev.map((r) =>
          r.id === seller.id ? { ...r, status: seller.status } : r
        )
      );
      alert("Could not update seller status. Check admin permissions/rules.");
      console.error(e);
    }
  };

  // NEW: Delete seller doc (admin-only)
  const onDeleteSeller = async (seller: SellerRow) => {
    const ok = window.confirm(
      `DELETE seller permanently?\n\n${seller.name} (${seller.email})\nID: ${seller.id}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    // optimistic remove
    const snapshotBefore = rows;
    setRows((prev) => prev.filter((r) => r.id !== seller.id));

    try {
      const res = await mgmtFetch("/api/admin/sellers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: seller.id }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to delete seller");
      }
    } catch (e) {
      // rollback on error
      setRows(snapshotBefore);
      alert("Could not delete seller. Check admin permissions/rules.");
      console.error(e);
    }
  };

  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Seller Directory — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Directory</h1>
              <p>View and manage all active sellers on Famous-Finds.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          <div className="filters-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by seller name, email, or ID…"
              className="form-input"
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Listings</th>
                  <th>Created</th>
                  {/* NEW */}
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const isDisabled = (s.status || "").toLowerCase() === "disabled";
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.status}</td>
                      <td style={{ textAlign: "right" }}>
                        {s.totalListings.toLocaleString("en-US")}
                      </td>
                      <td>{s.createdAt}</td>

                      {/* NEW ACTIONS (no layout changes elsewhere) */}
                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button
                            type="button"
                            className="btn-action btn-secondary"
                            onClick={() => onToggleDisable(s)}
                          >
                            {isDisabled ? "Enable" : "Disable"}
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-danger"
                            onClick={() => onDeleteSeller(s)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-message">
                      No sellers match this search.
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
          gap: 12px;
        }
        .form-input {
          width: 100%;
          max-width: 320px;
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827; /* gray-900 */
          outline: none;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .data-table {
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
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6; /* gray-100 */
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 8px 12px;
          color: #111827; /* gray-900 */
        }
        .data-table td:first-child {
          font-weight: 500;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280; /* gray-500 */
        }

        /* NEW (small, safe additions) */
        .actions {
          display: inline-flex;
          gap: 8px;
          justify-content: flex-end;
          align-items: center;
          white-space: nowrap;
        }
        .btn-action {
          border: 1px solid #d1d5db;
          background: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-action:hover {
          border-color: #9ca3af;
        }
        .btn-secondary {
          color: #111827;
        }
        .btn-danger {
          color: #b91c1c;
          border-color: #fca5a5;
        }
        .btn-danger:hover {
          border-color: #ef4444;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    if (!adminDb) return { props: { sellers: [] } };
    const [sellersSnap, listingsSnap] = await Promise.all([
      adminDb.collection("sellers").get(),
      adminDb.collection("listings").get(),
    ]);

    const listingsBySeller: Record<string, number> = {};
    listingsSnap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      const sellerId = d.sellerId || d.seller || "";
      if (!sellerId) return;
      listingsBySeller[sellerId] = (listingsBySeller[sellerId] || 0) + 1;
    });

    const sellers: SellerRow[] = sellersSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const id = doc.id;
      return {
        id,
        name: d.name || d.businessName || "Seller",
        email: d.email || "",
        status: d.status || "Active",
        totalListings: listingsBySeller[id] || 0,
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading sellers", err);
    return { props: { sellers: [] } };
  }
};
