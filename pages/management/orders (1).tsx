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
                Search and view all platform orders, including those in progress,
                completed, or refunded.
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, buyer, or seller…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
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

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Order ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Buyer
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Total (USD)
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 text-gray-900">{o.id}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {o.buyerEmail}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {o.sellerName}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {o.total
                        ? o.total.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{o.status}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {o.createdAt}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-sm text-gray-500"
                    >
                      No orders match this filter.
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
