// FILE: /pages/admin.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AdminHome() {
  return (
    <>
      <Head>
        <title>Admin – Famous Finds</title>
      </Head>
      {/* Updated to white background */}
      <div className="min-h-screen bg-white text-gray-900">
        <Header />

        <main className="mx-auto max-w-5xl px-4 py-10">
          <Link
            href="/"
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Admin access
          </h1>
          <p className="mt-3 text-sm text-gray-700">
            This is the internal control area for Famous Finds. From here,
            sellers can manage their business and management can access
            platform-level tools. In a production build, access would be
            restricted by login and permissions.
          </p>

          {/* Seller tools */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Seller portal
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Tools a seller can see once logged into the seller portal.
            </p>

            {/* Updated card styles */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Link
                href="/seller/orders"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">Orders</h3>
                <p className="mt-1 text-xs text-gray-600">
                  View new orders, statuses and update shipments.
                </p>
              </Link>

              <Link
                href="/seller/wallet"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Wallet & payouts
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Track balances, payouts and payout destinations.
                </p>
              </Link>

              <Link
                href="/seller/statements"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Statements
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Monthly statements summarising orders, fees and payouts.
                </p>
              </Link>

              <Link
                href="/seller/catalogue"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Catalogue
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Manage active listings and individual items.
                </p>
              </Link>

              <Link
                href="/seller/bulk-upload"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Bulk upload
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Upload many listings at once using a CSV/Excel file.
                </p>
              </Link>

              <Link
                href="/seller/insights"
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Insights
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Performance metrics and pricing estimator for sellers.
                </p>
              </Link>
            </div>
          </section>

          {/* Management tools (placeholders for now) */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Management area
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Internal tools only visible to platform management. These are
              placeholders – in a full build each would link to its own
              restricted module.
            </p>

            {/* Updated card styles */}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                <div className="text-sm font-semibold text-gray-900">
                  Storefront
                </div>
                <p className="mt-1">
                  Configure home page, featured collections and promotions.
                </p>
                <p className="mt-2 text-[11px] text-gray-500">
                  (Design-only demo – no live route yet.)
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                <div className="text-sm font-semibold text-gray-900">
                  Concierge
                </div>
                <p className="mt-1">
                  Manage white-glove sourcing requests and VIP clients.
                </D>
                <p className="mt-2 text-[11px] text-gray-500">
                  (Design-only demo – no live route yet.)
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                <div className="text-sm font-semibold text-gray-900">
                  Disputes & support
                </div>
                <p className="mt-1">
                  Oversee disputes, escalations and platform-level support.
                </p> {/* <-- This line was fixed from </mitp> to </p> */}
                <p className="mt-2 text-[11px] text-gray-500">
                  (Design-only demo – no live route yet.)
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
