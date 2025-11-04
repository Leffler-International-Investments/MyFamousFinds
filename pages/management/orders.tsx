// FILE: /pages/management/orders.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockOrders = [
  { id: "O-1001", buyer: "Emma", total: 9500, status: "Paid", createdAt: "2025-11-01" },
  { id: "O-1002", buyer: "Leon", total: 4300, status: "Dispatched", createdAt: "2025-11-02" },
  { id: "O-1003", buyer: "Sarah", total: 2100, status: "Refunded", createdAt: "2025-11-03" },
];

export default function ManagementOrders() {
  return (
    <>
      <Head>
        <title>Orders Overview — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Orders Overview
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track orders, shipping status, and refunds across the marketplace.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by order ID or buyer…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
            <select className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option>All statuses</option>
              <option>Paid</option>
              <option>Dispatched</option>
              <option>Refunded</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Buyer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Total (USD)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 text-gray-900">{order.id}</td>
                    <td className="px-4 py-2 text-gray-900">{order.buyer}</td>
                    <td className="px-4 py-2 text-gray-700">{order.createdAt}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (order.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Dispatched"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      ${order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later connect this to your orders collection (or Stripe / payment provider data).
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
