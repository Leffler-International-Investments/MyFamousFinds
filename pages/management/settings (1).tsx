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

      <div className="min-h-screen bg-black text-gray-100">
        <Header />

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
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

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-100">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Marketplace configuration
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="default-currency"
                  className="text-xs font-medium text-gray-700"
                >
                  Default Currency
                </label>
                <select
                  id="default-currency"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                  value="USD"
                  disabled
                >
                  <option>USD</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  All listings, statements, and payouts are currently locked to
                  US Dollars (USD).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="maintenance-mode"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  disabled
                />
                <label
                  htmlFor="maintenance-mode"
                  className="text-xs text-gray-700"
                >
                  Maintenance mode (placeholder only — controlled via deploys).
                </label>
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Note: This page is currently informational. Currency and platform
              mode are controlled by code and infrastructure, not live toggles.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
