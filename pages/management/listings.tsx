// FILE: /pages/management/listings.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type Listing = {
  id: string;
  title: string;
  seller: string;
  status: "Live" | "Pending" | "Rejected" | "Sold";
  price: number;
};

type Props = {
  items: Listing[];
};

export default function ManagementListings({ items }: Props) {
  const { loading } = useRequireAdmin();

  const [rows, setRows] = useState<Listing[]>(items);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Live" | "Pending" | "Rejected" | "Sold">("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  async function handleDelete(id: string, title: string) {
    if (deletingId) return;
    const ok = window.confirm(
      `Delete listing "${title}" permanently? It will disappear from the homepage and catalogue.`
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/delete/${id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to delete listing");
      }

      setRows((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      console.error("Delete listing error", err);
      alert(err?.message || "Unable to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkSold(id: string, title: string) {
    if (sellingId) return;
    const ok = window.confirm(
      `Mark listing "${title}" as SOLD and hide it from the homepage?`
    );
    if (!ok) return;

    try {
      setSellingId(id);
      const res = await fetch(`/api/admin/mark-sold/${id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to mark listing as sold");
      }

      // Update status locally so admin sees change immediately
      setRows((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                status: "Sold",
              }
            : l
        )
      );
    } catch (err: any) {
      console.error("Mark sold error", err);
      alert(err?.message || "Unable to mark listing as sold");
    } finally {
      setSellingId(null);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>All Listings — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>All Listings</h1>
              <p>Search, review, and moderate every item on Famous-Finds.</p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by title, seller, or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as any)
              }
              className="form-input"
              style={{ maxWidth: "220px" }}
            >
              <option value="All">All statuses</option>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Price (US$)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td>{l.seller}</td>
                    <td>
                      {l.price
                        ? l.price.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={
                          "status-badge " +
                          (l.status === "Live"
                            ? "status-active"
                            : l.status === "Pending"
                            ? "status-pending"
                            : l.status === "Rejected"
                            ? "status-rejected"
                            : "status-sold")
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/product/${l.id}`}
                        className="btn-table-view"
                      >
                        View
                      </Link>

                      {/* Mark sold (hide from homepage) */}
                      {l.status !== "Sold" && (
                        <button
                          type="button"
                          className="btn-table-sold"
                          onClick={() => handleMarkSold(l.id, l.title)}
                          disabled={sellingId === l.id}
                        >
                          {sellingId === l.id ? "Marking…" : "Mark sold"}
                        </button>
                      )}

                      {/* Delete permanently */}
                      <button
                        type="button"
                        className="btn-table-delete"
                        onClick={() => handleDelete(l.id, l.title)}
                        disabled={deletingId === l.id}
                      >
                        {deletingId === l.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-message">
                      No listings match this filter.
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
          font-size: 12px;
          font-weight: 500;
        }
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-sold {
          background: #e5e7eb;
          color: #4b5563;
        }

        .btn-table-view {
          font-size: 12px;
          font-weight: 500;
          color: #2563eb;
          text-decoration: none;
          margin-right: 8px;
        }
        .btn-table-view:hover {
          color: #1d4ed8;
        }

        .btn-table-sold {
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #047857;
          background: #ecfdf5;
          color: #047857;
          cursor: pointer;
          margin-right: 8px;
        }
        .btn-table-sold:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .btn-table-sold:hover:not(:disabled) {
          background: #d1fae5;
        }

        .btn-table-delete {
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #dc2626;
          background: #fee2e2;
          color: #b91c1c;
          cursor: pointer;
        }
        .btn-table-delete:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .btn-table-delete:hover:not(:disabled) {
          background: #fecaca;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb.collection("listings").get();

    const items: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: Listing["status"] = "Live";

      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";
      else if (/sold/i.test(rawStatus)) status = "Sold";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerId || "Seller",
        price: Number(d.price || 0),
        status,
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listings", err);
    return { props: { items: [] } };
  }
};
