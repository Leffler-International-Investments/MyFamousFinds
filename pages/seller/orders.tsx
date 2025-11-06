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
        
        // Format data for the table
        const formattedRows = json.orders.map((order: any) => ({
          id: order.id,
          item: order.title || "Unknown Item",
          buyer: order.buyerName || "Private Buyer",
          total: `$${(order.price || 0).toLocaleString("en-US")}`,
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
    return <div className="min-h-screen bg-black"></div>; // Show blank while checking auth
  }

  return (
    <>
      <Head>
        <title>Seller — Orders | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
          <Link
            href="/seller/dashboard"
            className="text-xs text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-white">My orders</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review new orders and mark items as shipped once dispatched.
          </p>

          <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Buyer</th>
                    <th className="px-3 py-2 text-left">Total</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">
                        Loading orders...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-red-400">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && rows.length === 0 && (
                     <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">
                        You have no orders yet.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{r.id}</td>
                      <td className="px-3 py-2">{r.item}</td>
                      <td className="px-3 py-2">{r.buyer}</td>
                      <td className="px-3 py-2">{r.total}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `In a full version, ${r.id} would be updated to "Shipped".`
                            )
                          }
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black hover:bg-gray-100"
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
    </>
  );
}
