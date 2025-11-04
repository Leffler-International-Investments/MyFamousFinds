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
      <div className="min-h-screen bg-black text-white">
        <Header />

        <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">Admin access</h1>
          <p className="mt-3 text-gray-300">
            This is the internal control area for Famous Finds. From here,
            sellers can manage their business and management can access
            platform-level tools. In a production build, access would be
            restricted by login and permissions.
          </p>

          {/* Seller tools */}
          <section className="mt-8">
            <h2 className="text-base font-semibold text-gray-100">
              Seller portal
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Tools a seller can see once logged into the seller portal.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Link
                href="/seller/orders"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Orders</h3>
                <p className="mt-1 text-xs text-gray-400">
                  View new orders, statuses and update shipments.
                </p>
              </Link>

              <Link
                href="/seller/wallet"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Wallet & payouts</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Track balances, payouts and payout destinations.
                </p>
              </Link>

              <Link
                href="/seller/statements"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Statements</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Monthly statements summarising orders, fees and payouts.
                </p>
              </Link>

              <Link
                href="/seller/catalogue"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Catalogue</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Manage active listings and individual items.
                </p>
              </Link>

              <Link
                href="/seller/bulk-upload"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Bulk upload</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Upload many listings at once using a CSV/Excel file.
                </p>
              </Link>

              <Link
                href="/seller/insights"
                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600"
              >
                <h3 className="text-sm font-semibold">Insights</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Performance metrics and pricing estimator for sellers.
                </p>
              </Link>
            </div>
          </section>

          {/* Management tools (placeholders for now) */}
          <section className="mt-10">
            <h2 className="text-base font-semibold text-gray-100">
              Management area
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Internal tools only visible to platform management. These are
              placeholders – in a full build each would link to its own
              restricted module.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-gray-300">
                <div className="text-sm font-semibold">Storefront</div>
                <p className="mt-1">
                  Configure home page, featured collections and promotions.
                </p>
                <p className="mt-2 text-[11px] text-gray-500">
                  (Design-only demo – no live route yet.)
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-gray-300">
                <div className="text-sm font-semibold">Concierge</div>
                <p className="mt-1">
                  Manage white-glove sourcing requests and VIP clients.
                </p>
                <p className="mt-2 text-[11px] text-gray-500">
                  (Design-only demo – no live route yet.)
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-gray-300">
                <div className="text-sm font-semibold">Disputes & support</div>
                <p className="mt-1">
                  Oversee disputes, escalations and platform-level support.
                </p>
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
