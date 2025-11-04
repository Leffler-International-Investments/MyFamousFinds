// FILE: /pages/management/settings.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementSettings() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>System Settings — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                System Settings
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Global settings for Famous-Finds marketplace.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <form className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Marketplace Name
              </label>
              <input
                type="text"
                defaultValue="Famous-Finds"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@famous-finds.com"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Default Currency
              </label>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none">
                <option>USD</option>
                <option>EUR</option>
                <option>AUD</option>
                <option>GBP</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="maintenance-mode"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="maintenance-mode" className="text-xs text-gray-700">
                Enable maintenance mode (buyers see a maintenance page)
              </label>
            </div>

            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Save Settings
            </button>

            <p className="text-xs text-gray-500">
              Later connect this form to your configuration store or Firestore.
            </p>
          </form>
        </main>
        <Footer />
      </div>
    </>
  );
}
