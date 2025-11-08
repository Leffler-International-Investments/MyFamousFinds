// FILE: /pages/management/orders.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type Order = {
  id: string;
  buyer: string;
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
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.buyer.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Orders Overview — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Orders Overview
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track orders, shipping status, and refunds across the
                marketplace.
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Processing">Processing</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Refunded">Refunded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Buyer
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Total (US$)
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 text-xs font-mono text-gray-700">
                      {o.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {o.buyer}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {o.createdAt}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900">
                      {o.total.toLocaleString("en-AU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No orders found for the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(200).get();

    const orders: Order[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const createdAt =
        d.createdAt && typeof d.createdAt.toDate === "function"
          ? d.createdAt.toDate()
          : null;
      const iso =
        createdAt && !isNaN(createdAt.getTime())
          ? createdAt.toISOString().slice(0, 10)
          : "";

      const total =
        typeof d.totalGross === "number"
          ? d.totalGross
          : typeof d.total === "number"
          ? d.total
          : 0;

      return {
        id: doc.id,
        buyer: d.buyerName || d.buyerEmail || "Buyer",
        total,
        status: d.status || "Paid",
        createdAt: iso,
      };
    });

    return { props: { orders } };
  } catch (err) {
    console.error("Error loading orders", err);
    return { props: { orders: [] } };
  }
};
