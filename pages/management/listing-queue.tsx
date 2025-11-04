// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockListings = [
  {
    id: "L-001",
    title: "Chanel Classic Flap Medium",
    seller: "VintageLux Boutique",
    submittedAt: "2025-10-30",
    category: "Bags",
    status: "Pending",
  },
  {
    id: "L-002",
    title: "Rolex Submariner 16610",
    seller: "Classic Timepieces",
    submittedAt: "2025-10-31",
    category: "Watches",
    status: "Pending",
  },
  {
    id: "L-003",
    title: "Dior Bar Jacket",
    seller: "Paris Finds",
    submittedAt: "2025-11-01",
    category: "Clothing",
    status: "In Review",
  },
];

export default function ManagementListingQueue() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Listing Review Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Listing Review Queue
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and approve new product listings submitted by sellers.
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
              Show In Review
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Listing ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Category
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
                {mockListings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-4 py-2 text-gray-900">{listing.id}</td>
                    <td className="px-4 py-2 text-gray-900">{listing.title}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {listing.seller}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {listing.category}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {listing.submittedAt}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (listing.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800")
                        }
                      >
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="mr-2 text-xs font-medium text-green-700 hover:text-green-900">
                        Approve
                      </button>
                      <button className="text-xs font-medium text-red-600 hover:text-red-800">
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can connect this queue to your listings collection where{" "}
            <code>status = &quot;pending_approval&quot;</code>, and wire the
            Approve / Reject buttons to API endpoints.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}
