// FILE: /pages/management/seller-profiles.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockSellers = [
  { id: "s_001", name: "VintageLux Boutique", country: "USA", status: "Approved", items: 123 },
  { id: "s_002", name: "Classic Timepieces", country: "UK", status: "Pending", items: 34 },
  { id: "s_003", name: "Paris Finds", country: "France", status: "Suspended", items: 58 },
];

export default function ManagementSellerProfiles() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Profiles / Controls — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Profiles / Controls
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Approve new sellers, adjust limits, and control marketplace access.
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
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              View New Applications
            </button>
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Export Sellers (CSV)
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Seller Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Country</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Active Listings</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockSellers.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-4 py-2 text-gray-900">{seller.id}</td>
                    <td className="px-4 py-2 text-gray-900">{seller.name}</td>
                    <td className="px-4 py-2 text-gray-700">{seller.country}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (seller.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : seller.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {seller.items}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can connect this grid to your seller collection or
            Stripe Connect accounts.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
