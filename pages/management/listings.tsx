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

  if (loading) return <div className="dashboard-page"></div>;

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

          <section className="dashboard-section">
            <div className="controls">
              <input
                type="text"
                placeholder="Search by title, seller, or ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as any)
                }
                className="filter-select"
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
                      <td className="font-medium">{l.title}</td>
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
                          className={`status-badge ${
                            l.status === "Live"
                              ? "status-live"
                              : l.status === "Pending"
                              ? "status-pending"
                              : "status-rejected"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/product/${l.id}`} className="action-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No listings match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .controls {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-input,
        .filter-select {
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
          background: #ffffff;
        }
        .search-input {
          width: 100%;
          max-width: 320px;
        }
        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #3b82f6; /* blue-500 */
          box-shadow: 0 0 0 1px #3b82f6;
        }
        .table-wrapper {
          overflow-x: auto;
          width: 100%;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 8px;
        }
        .data-table {
          width: 100%;
          min-width: 600px;
          font-size: 14px;
          border-collapse: collapse;
        }
        .data-table thead {
          background-color: #f9fafb; /* gray-50 */
        }
        .data-table th,
        .data-table td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
          white-space: nowrap;
        }
        .data-table th {
          font-weight: 600;
          color: #374151; /* gray-700 */
          font-size: 12px;
          text-transform: uppercase;
        }
        .data-table td {
          color: #4b5563; /* gray-600 */
        }
        .data-table td.font-medium {
          font-weight: 500;
          color: #111827; /* gray-900 */
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        .text-center {
          text-align: center;
          padding: 24px;
          color: #6b7280; /* gray-500 */
        }
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-live {
          background-color: #dcfce7; /* green-100 */
          color: #166534; /* green-800 */
        }
        .status-pending {
          background-color: #fef9c3; /* yellow-100 */
          color: #854d0e; /* yellow-800 */
        }
        .status-rejected {
          background-color: #fee2e2; /* red-100 */
          color: #991b1b; /* red-800 */
        }
        .action-link {
          font-size: 13px;
          font-weight: 500;
          color: #2563eb; /* blue-600 */
          text-decoration: none;
        }
        .action-link:hover {
          color: #1d4ed8; /* blue-700 */
          text-decoration: underline;
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
