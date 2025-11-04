// FILE: /pages/management/vetting-queue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockApplications = [
  {
    id: "APP-001",
    businessName: "VintageLux Boutique",
    contactEmail: "owner@vintagelux.com",
    submittedAt: "2025-10-28",
    country: "USA",
    status: "Pending",
  },
  {
    id: "APP-002",
    businessName: "Classic Timepieces",
    contactEmail: "hello@classictimepieces.co.uk",
    submittedAt: "2025-10-29",
    country: "UK",
    status: "Pending",
  },
  {
    id: "APP-003",
    businessName: "Paris Finds",
    contactEmail: "bonjour@parisfinds.fr",
    submittedAt: "2025-10-30",
    country: "France",
    status: "In Review",
  },
];

export default function ManagementVettingQueue() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Vetting Queue
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Approve or deny new seller applications before they can list
                inventory.
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
              Show Pending Only
            </button>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
              Export Applications (CSV)
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Application ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Business Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Contact Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-2 text-gray-900">{app.id}</td>
                    <td className="px-4 py-2 text-gray-900">
                      {app.businessName}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {app.contactEmail}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{app.country}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {app.submittedAt}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (app.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800")
                        }
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="mr-2 text-xs font-medium text-green-700 hover:text-green-900">
                        Approve
                      </button>
                      <button className="text-xs font-medium text-red-600 hover:text-red-800">
                        Deny
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can replace the mockApplications array with data from your
            database (e.g., <code>pendingSellers</code> collection) and wire the
            Approve / Deny buttons to an API route.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}
