// FILE: /pages/management/history-listings.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type HistoryEntry = {
  id: string;
  listingId: string;
  title: string;
  seller: string;
  brand: string;
  category: string;
  condition: string;
  details: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  soldAt: string;
};

type Props = {
  entries: HistoryEntry[];
};

export default function HistoryListings({ entries }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.seller.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.listingId.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [entries, query, statusFilter]);

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Listing History — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Listing History</h1>
              <p>Full audit trail of every listing — added, updated, sold, or deleted.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by title, brand, seller, or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: 200 }}
            >
              <option value="All">All statuses</option>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Sold">Sold</option>
              <option value="Deleted">Deleted</option>
            </select>
            <span className="result-count">{visible.length} entries</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Added</th>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Details</th>
                  <th>Price (US$)</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Sold</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} className={e.status === "Deleted" ? "row-deleted" : e.status === "Sold" ? "row-sold" : ""}>
                    <td className="cell-date">{e.createdAt || "—"}</td>
                    <td>
                      <div className="listing-title">{e.title}</div>
                      <div className="listing-id">ID: {e.listingId}</div>
                    </td>
                    <td>{e.seller || "—"}</td>
                    <td>{e.brand || "—"}</td>
                    <td>{e.category || "—"}</td>
                    <td>{e.condition || "—"}</td>
                    <td className="cell-details">{e.details || "—"}</td>
                    <td className="cell-price">{e.price ? `$${e.price.toLocaleString()}` : "—"}</td>
                    <td>
                      <span className={
                        "status-badge " +
                        (e.status === "Live" ? "status-active"
                          : e.status === "Pending" ? "status-pending"
                          : e.status === "Rejected" ? "status-rejected"
                          : e.status === "Sold" ? "status-sold"
                          : e.status === "Deleted" ? "status-deleted"
                          : "status-other")
                      }>
                        {e.status}
                      </span>
                    </td>
                    <td className="cell-date">{e.updatedAt || "—"}</td>
                    <td className="cell-date">{e.soldAt || "—"}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={11} className="table-message">
                      No listing history entries found.
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
          align-items: center;
        }
        .form-input {
          max-width: 320px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }
        .result-count {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
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
          font-size: 13px;
        }
        .data-table thead {
          background: #f9fafb;
        }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
          font-size: 12px;
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
          vertical-align: top;
        }
        .listing-title {
          font-weight: 500;
          font-size: 13px;
        }
        .listing-id {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .cell-date {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
        }
        .cell-price {
          font-weight: 600;
          white-space: nowrap;
        }
        .cell-details {
          max-width: 200px;
          font-size: 12px;
          color: #4b5563;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }

        .row-deleted {
          background: #fef2f2;
        }
        .row-sold {
          background: #f9fafb;
        }

        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
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
        .status-deleted {
          background: #fee2e2;
          color: #b91c1c;
        }
        .status-other {
          background: #f3f4f6;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const entries: HistoryEntry[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};

      const rawStatus = (d.status || "").toString();
      let status = rawStatus || "Unknown";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";
      else if (/sold/i.test(rawStatus)) status = "Sold";
      else if (/deleted|removed/i.test(rawStatus)) status = "Deleted";
      else if (/live/i.test(rawStatus)) status = "Live";

      return {
        id: doc.id,
        listingId: doc.id,
        title: d.title || "Untitled",
        seller: d.sellerName || d.sellerId || "—",
        brand: String(d.brand || d.designer || ""),
        category: String(d.category || ""),
        condition: String(d.condition || ""),
        details: String(d.details || ""),
        price: Number(d.price || d.priceUsd || 0),
        status,
        createdAt: d.createdAt?.toDate?.().toLocaleDateString("en-US") || "",
        updatedAt: d.updatedAt?.toDate?.().toLocaleDateString("en-US") || "",
        soldAt: d.soldAt?.toDate?.().toLocaleDateString("en-US") || "",
      };
    });

    return { props: { entries } };
  } catch (err) {
    console.error("Error loading listing history", err);
    return { props: { entries: [] } };
  }
};
