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
  status: "Live" | "Pending" | "Rejected";
  price: number;
};

type Props = {
  items: Listing[];
};

export default function ManagementListings({ items }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Live" | "Pending" | "Rejected">("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>All Listings — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>All Listings</h1>
              <p>
                Search, review, and moderate every item on Famous-Finds.
              </p>
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
              style={{maxWidth: "200px"}}
            >
              <option value="All">All statuses</option>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
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
                            : "status-rejected")
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

      {/* Styles for the light theme table and forms */}
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
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
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
        
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-active {
          background: #d1fae5; /* green-100 */
          color: #065f46; /* green-800 */
        }
        .status-pending {
          background: #fef3c7; /* yellow-100 */
          color: #92400e; /* yellow-800 */
        }
        .status-rejected {
          background: #fee2e2; /* red-100 */
          color: #991b1b; /* red-800 */
        }
        
        .btn-table-view {
          font-size: 12px;
          font-weight: 500;
          color: #2563eb; /* blue-600 */
          text-decoration: none;
        }
        .btn-table-view:hover {
          color: #1d4ed8; /* blue-700 */
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
