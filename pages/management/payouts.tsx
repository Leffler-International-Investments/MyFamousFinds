// FILE: /pages/management/payouts.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockPayouts = [
  { id: "P-001", seller: "VintageLux Boutique", amount: 7200, currency: "USD", status: "Paid", date: "2025-11-01" },
  { id: "P-002", seller: "Classic Timepieces", amount: 3900, currency: "USD", status: "Scheduled", date: "2025-11-05" },
];

export default function ManagementPayouts() {
  return (
    <>
      <Head>
        <title>Payouts & Finance — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Payouts & Finance
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Overview of seller balances, upcoming payouts, and past transfers.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Paid (30 days)</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">$42,500</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Upcoming Payouts</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">$9,800</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Failed / On Hold</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">$0</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Payout ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Seller</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockPayouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-gray-900">{p.id}</td>
                    <td className="px-4 py-2 text-gray-900">{p.seller}</td>
                    <td className="px-4 py-2 text-gray-700">{p.date}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (p.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800")
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            This page can later be connected to Stripe Connect balances and payout schedules.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
