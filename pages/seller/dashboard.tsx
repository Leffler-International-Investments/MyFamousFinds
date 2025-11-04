// FILE: /pages/seller/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const sellerKpis = [
  { label: "Live listings", value: "24", sub: "Visible in the marketplace" },
  { label: "Items pending review", value: "3", sub: "Waiting for approval" },
  { label: "Orders in transit", value: "5", sub: "On the way to buyers" },
  { label: "Wallet balance", value: "$1,920", sub: "Available to withdraw" },
  { label: "Upcoming payouts", value: "$860", sub: "Scheduled next 7 days" },
  { label: "Average rating", value: "4.9★", sub: "Last 30 days" },
];

export default function SellerDashboard() {
  return (
    <>
      <Head>
        <title>Seller Console — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          {/* Back to main dashboard / index */}
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Seller Console</h1>
              <p className="mt-1 text-sm text-gray-400">
                Manage your listings, orders and payouts in one place.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-200">
              Tip: use the AI Butler bubble (bottom right) to help fill titles &amp; descriptions.
            </div>
          </div>

          {/* Quick stats */}
          <section className="grid gap-4 md:grid-cols-3">
            {sellerKpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {k.label}
                </p>
                <p className="mt-2 text-xl font-semibold">{k.value}</p>
                {k.sub && (
                  <p className="mt-1 text-xs text-gray-500">
                    {k.sub}
                  </p>
                )}
              </div>
            ))}
          </section>

          {/* Inventory / listing tools */}
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">List &amp; manage inventory</h2>
              <span className="text-xs text-gray-500">
                Everything you need to upload and edit products.
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Sell single item */}
              <Link
                href="/sell"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-fuchsia-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">Sell a single item</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Guided form with AI Butler to help with title, description and pricing hints.
                  </p>
                </div>
                <div className="mt-3 text-xs text-fuchsia-300 group-hover:text-fuchsia-200">
                  Start a listing →
                </div>
              </Link>

              {/* Bulk upload */}
              <Link
                href="/seller/bulk-upload"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-fuchsia-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">Bulk upload</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Upload a CSV or spreadsheet of items, then let AI Butler help you clean up details.
                  </p>
                </div>
                <div className="mt-3 text-xs text-fuchsia-300 group-hover:text-fuchsia-200">
                  Open bulk tools →
                </div>
              </Link>

              {/* Catalogue */}
              <Link
                href="/seller/catalogue"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-fuchsia-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">My catalogue</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    See all your listings, update prices, toggle visibility or archive items.
                  </p>
                </div>
                <div className="mt-3 text-xs text-fuchsia-300 group-hover:text-fuchsia-200">
                  View catalogue →
                </div>
              </Link>
            </div>
          </section>

          {/* Orders & money */}
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Orders &amp; money</h2>
              <span className="text-xs text-gray-500">
                Track orders, payouts and download statements.
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Orders */}
              <Link
                href="/seller/orders"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-emerald-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">Orders</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    See new, in-transit and delivered orders. Mark shipped and add tracking.
                  </p>
                </div>
                <div className="mt-3 text-xs text-emerald-300 group-hover:text-emerald-200">
                  Go to orders →
                </div>
              </Link>

              {/* Wallet */}
              <Link
                href="/seller/wallet"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-emerald-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">Wallet &amp; payouts</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Check available balance, upcoming payouts and connect your bank via Stripe.
                  </p>
                </div>
                <div className="mt-3 text-xs text-emerald-300 group-hover:text-emerald-200">
                  Open wallet →
                </div>
              </Link>

              {/* Statements */}
              <Link
                href="/seller/statements"
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-emerald-400/70"
              >
                <div>
                  <h3 className="text-sm font-semibold">Statements &amp; reports</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Monthly breakdown by order and fees. Export PDFs for your accountant.
                  </p>
                </div>
                <div className="mt-3 text-xs text-emerald-300 group-hover:text-emerald-200">
                  View statements →
                </div>
              </Link>
            </div>
          </section>

          {/* AI Butler helper panel */}
          <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-5">
            <h2 className="text-sm font-semibold">AI Butler for sellers</h2>
            <p className="mt-2 text-xs text-gray-300">
              Use the AI Butler bubble in the bottom-right corner on any page to:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-300">
              <li>• Generate catchy listing titles and rich product descriptions.</li>
              <li>• Suggest pricing bands based on condition and brand.</li>
              <li>• Help you find reports, wallet info or statements in the console.</li>
              <li>• Answer &quot;how do I…&quot; questions about selling on Famous Finds.</li>
            </ul>
            <button
              type="button"
              onClick={() =>
                alert("Look for the AI Butler bubble on the bottom-right of your screen.")
              }
              className="mt-4 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
            >
              Where is the AI Butler?
            </button>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
