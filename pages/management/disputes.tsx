// FILE: /pages/management/disputes.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockDisputes = [
  { id: "D-1001", orderId: "O-1003", buyer: "Sarah", reason: "Item not as described", status: "Open" },
  { id: "D-1002", orderId: "O-0999", buyer: "Daniel", reason: "Damaged on arrival", status: "In Review" },
];

export default function ManagementDisputes() {
  return (
    <>
      <Head>
        <title>Returns & Disputes — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Returns & Disputes
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track escalations between buyers and sellers and resolve cases.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Show Open Cases
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Case ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Buyer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockDisputes.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-gray-900">{d.id}</td>
                    <td className="px-4 py-2 text-gray-900">{d.orderId}</td>
                    <td className="px-4 py-2 text-gray-700">{d.buyer}</td>
                    <td className="px-4 py-2 text-gray-700">{d.reason}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (d.status === "Open"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800")
                        }
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Review Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            You can later add timelines, internal notes, and resolution outcomes.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
