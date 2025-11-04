// FILE: /pages/management/sellers.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockSellers = [
  {
    id: "SELL-001",
    name: "VintageLux Boutique",
    email: "owner@vintagelux.com",
    country: "USA",
    listings: 123,
    status: "Active",
  },
  {
    id: "SELL-002",
    name: "Classic Timepieces",
    email: "hello@classictimepieces.co.uk",
    country: "UK",
    listings: 34,
    status: "Active",
  },
  {
    id: "SELL-003",
    name: "Paris Finds",
    email: "bonjour@parisfinds.fr",
    country: "France",
    listings: 58,
    status: "Suspended",
  },
];

export default function ManagementSellers() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Directory — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Directory
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Search and filter all approved sellers on the platform.
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
              placeholder="Search by seller name or email…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
            <select className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option>All statuses</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Active Listings
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
                {mockSellers.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-4 py-2 text-gray-900">{seller.id}</td>
                    <td className="px-4 py-2 text-gray-900">{seller.name}</td>
                    <td className="px-4 py-2 text-gray-700">{seller.email}</td>
                    <td className="px-4 py-2 text-gray-700">{seller.country}</td>
                    <td className="px-4 py-2 text-gray-900">
                      {seller.listings}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (seller.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/management/seller-profiles?id=${seller.id}`}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can connect this table to your sellers collection and add
            real search / filters via an API route.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}
