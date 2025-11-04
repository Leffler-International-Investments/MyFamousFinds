// FILE: /pages/management/logs.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockLogs = [
  { id: 1, time: "2025-11-05 09:15", actor: "system", action: "Nightly payout job completed" },
  { id: 2, time: "2025-11-05 08:52", actor: "admin@famous-finds.com", action: "Updated commission rate to 15%" },
];

export default function ManagementLogs() {
  return (
    <>
      <Head>
        <title>Logs & Audit Trail — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Logs & Audit Trail
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track important system and admin actions.
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
            <button className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
              Download Logs (CSV)
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Actor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-gray-700">{log.time}</td>
                    <td className="px-4 py-2 text-gray-900">{log.actor}</td>
                    <td className="px-4 py-2 text-gray-700">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can hook this to a proper audit log table in your database.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
