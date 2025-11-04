// FILE: /pages/management/support-tickets.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockTickets = [
  { id: "T-1001", subject: "Where is my order?", from: "emma@example.com", status: "Open", priority: "High" },
  { id: "T-1002", subject: "Seller not responding", from: "david@example.com", status: "In Progress", priority: "Medium" },
];

export default function ManagementSupport() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Support Tickets — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Central inbox for buyer and seller requests.
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
              placeholder="Search tickets…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
            <select className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option>All statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Ticket ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Subject</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">From</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Priority</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockTickets.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-gray-900">{t.id}</td>
                    <td className="px-4 py-2 text-gray-900">{t.subject}</td>
                    <td className="px-4 py-2 text-gray-700">{t.from}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (t.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800")
                        }
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can integrate with a helpdesk tool or your own tickets collection.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
