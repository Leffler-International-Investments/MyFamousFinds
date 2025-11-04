// FILE: /pages/management/listings.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockListings = [
  { id: "L-1001", title: "Hermès Kelly 28", seller: "VintageLux Boutique", status: "Live", price: 8900 },
  { id: "L-1002", title: "Rolex Submariner 16610", seller: "Classic Timepieces", status: "Pending", price: 10500 },
  { id: "L-1003", title: "Chanel Classic Flap", seller: "Paris Finds", status: "Rejected", price: 6200 },
];

export default function ManagementListings() {
  return (
    <>
      <Head>
        <title>All Listings — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">All Listings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Search, review, and moderate every item on Famous-Finds.
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
              placeholder="Search by title, ID, or seller…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
            <select className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option>All statuses</option>
              <option>Live</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Item</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Seller</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Price (USD)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockListings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-900">{item.id}</td>
                    <td className="px-4 py-2 text-gray-900">{item.title}</td>
                    <td className="px-4 py-2 text-gray-700">{item.seller}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (item.status === "Live"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can add pagination and hook this into your listing search API.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
