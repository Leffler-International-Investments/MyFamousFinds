// FILE: /pages/seller/orders.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Security

type OrderRow = {
  id: string;
  item: string;
  buyer: string;
  total: string;
  status: string;
};

export default function SellerOrders() {
  const { loading: authLoading } = useRequireSeller();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for security check

    // Function to load orders
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        // This API route will securely get the orders for the logged-in seller
        const res = await fetch("/api/seller/orders");
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.error || "Failed to fetch orders.");
        }

        // Format data for the table — use field names returned by the API
        const formattedRows = json.orders.map((order: any) => ({
          id: order.id,
          item: order.item || order.title || "Unknown Item",
          buyer: order.buyer || order.buyerName || "Private Buyer",
          total: order.total || `$${(order.price || 0).toLocaleString("en-US")}`,
          status: order.status || "Unknown",
        }));
        setRows(formattedRows);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [authLoading]);

  if (authLoading) {
    return <div className="dark-theme-page"></div>; // Show blank while checking auth
  }

  return (
    <>
      <Head>
        <title>Seller — Orders | Famous Finds</title>
      </Head>
      <div className="dark-theme-page">
        <Header />
        <main className="section">
          <div className="back-link">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-white">My orders</h1>
          <p className="subtitle">
            Review new orders and mark items as shipped once dispatched.
          </p>

          {/* Using sell-card style from catalogue */}
          <section className="sell-card" style={{ marginTop: "24px" }}>
            <div className="table-overflow-wrapper">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Buyer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        Loading orders...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={6} className="table-message error">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        You have no orders yet.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.item}</td>
                        <td>{r.buyer}</td>
                        <td>{r.total}</td>
                        <td>{r.status}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `In a full version, ${r.id} would be updated to "Shipped".`
                              )
                            }
                            className="btn-primary"
                          >
                            Mark as shipped
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .back-link a:hover {
          color: #e5e7eb; /* gray-200 */
        }
        h1 {
          margin-top: 16px;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #9ca3af; /* gray-400 */
        }
        
        /* From catalogue.tsx */
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          color: #e5e7eb;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        .catalogue-table th {
          font-size: 11px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }
        .table-message.error {
          color: #f87171; /* red-400 */
        }

        .btn-primary {
          border-radius: 999px;
          background: white;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #e5e7eb; /* gray-200 */
        }
      `}</style>
    </>
  );
}
