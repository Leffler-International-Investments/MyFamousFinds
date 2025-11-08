// FILE: /pages/seller/orders.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller";

type OrderRow = {
  id: string;
  item: string;
  buyer: string;
  total: string; // already formatted with $
  status: string;
};

export default function SellerOrdersPage() {
  const { loading: authLoading } = useRequireSeller();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/seller/orders");
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Failed to load orders");
        }
        setOrders(data.orders || []);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading]);

  return (
    <>
      <Head>
        <title>Seller — Orders | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <Link
            href="/seller/dashboard"
            className="mb-4 inline-block text-xs text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-2xl font-semibold text-white">My orders</h1>
          <p className="mt-1 text-sm text-gray-300">
            Review new orders and mark items as shipped once dispatched. All
            amounts are shown in USD.
          </p>

          {loading && (
            <p className="mt-6 text-sm text-gray-300">Loading orders…</p>
          )}
          {error && (
            <p className="mt-6 text-sm text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="mt-6 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
              <table className="min-w-full divide-y divide-gray-700 text-xs">
                <thead className="bg-gray-950">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">
                      Order
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">
                      Item
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">
                      Buyer
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-300">
                      Total (USD)
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 text-[11px] text-gray-200">
                        {o.id}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-gray-100">
                        {o.item}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-gray-300">
                        {o.buyer}
                      </td>
                      <td className="px-4 py-2 text-right text-[11px] text-gray-100">
                        {o.total}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-gray-300">
                        {o.status}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-[11px] text-gray-400"
                      >
                        You don’t have any orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
