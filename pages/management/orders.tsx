// FILE: /pages/management/orders.tsx
import { useState, useMemo } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Order = {
  id: string;
  buyerEmail: string;
  sellerName: string;
  total: number;
  status: string;
  createdAt: string;
};

type Props = {
  orders: Order[];
};

export default function ManagementOrders({ orders }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.buyerEmail.toLowerCase().includes(q) ||
        o.sellerName.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  if (loading) return <div className="dashboard-page"></div>;

  return (
    <>
      <Head>
        <title>Orders Overview — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Orders Overview</h1>
              <p>
                Search and view all platform orders, including those in progress,
                completed, or refunded.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="dashboard-section">
            <div className="controls">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order ID, buyer, or seller…"
                className="search-input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th className="text-right">Total (USD)</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium">{o.id}</td>
                      <td>{o.buyerEmail}</td>
                      <td>{o.sellerName}</td>
                      <td className="text-right">
                        {o.total
                          ? o.total.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })
                          : "—"}
                      </td>
                      <td>{o.status}</td>
                      <td>{o.createdAt}</td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No orders match this filter.
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
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
          padding: 24px;
          color: #6b7280; /* gray-500 */
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const orders: Order[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        buyerEmail: d.buyerEmail || "",
        sellerName: d.sellerName || "",
        total: Number(d.total || 0),
        status: d.status || "Pending",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { orders } };
  } catch (err) {
    console.error("Error loading orders", err);
    return { props: { orders: [] } };
  }
};
