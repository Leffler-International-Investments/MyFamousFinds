// FILE: /pages/management/analytics.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementAnalytics() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Analytics & Reports — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Analytics & Reports
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                High-level KPIs for buyers, sellers, orders, and marketplace health.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">GMV (Last 30 days)</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">$125,400</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Active Sellers</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">87</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Active Listings</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">1,243</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Dispute Rate</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">0.8%</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Downloads</h2>
            <p className="mt-1 text-xs text-gray-600">
              Export CSV reports for your finance or BI tools.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Orders (Last 30 days)
              </button>
              <button className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Sellers Performance
              </button>
              <button className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Listings Conversion
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can connect these KPIs to your database or an analytics tool
            (e.g., BigQuery, Metabase, or custom dashboards).
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
