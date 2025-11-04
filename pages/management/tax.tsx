// FILE: /pages/management/tax.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const mockTaxSummary = [
  { sellerId: "s_001", sellerName: "VintageLux Boutique", year: 2025, grossSales: 95000, formsIssued: true },
  { sellerId: "s_002", sellerName: "Classic Timepieces", year: 2025, grossSales: 42000, formsIssued: false },
];

export default function ManagementTax() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Tax & Compliance — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Tax & Compliance
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                High-level tax reporting for US marketplaces (e.g., 1099-K) and
                other jurisdictions.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Annual Summary</h2>
              <p className="mt-1 text-xs text-gray-600">
                Connect to Avalara / Stripe Tax / Tax1099 to generate and track filings.
              </p>
              <button className="mt-3 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black">
                Configure Tax Provider
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">W-9 Collection</h2>
              <p className="mt-1 text-xs text-gray-600">
                Status of seller tax forms and onboarding requirements.
              </p>
              <button className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                View W-9 Status
              </button>
            </section>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Seller</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Year</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Gross Sales (USD)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Forms Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockTaxSummary.map((row) => (
                  <tr key={row.sellerId}>
                    <td className="px-4 py-2 text-gray-900">{row.sellerName}</td>
                    <td className="px-4 py-2 text-gray-700">{row.year}</td>
                    <td className="px-4 py-2 text-gray-900">
                      ${row.grossSales.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (row.formsIssued
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800")
                        }
                      >
                        {row.formsIssued ? "Issued" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            This summary table can later be driven by your tax provider callback data.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
