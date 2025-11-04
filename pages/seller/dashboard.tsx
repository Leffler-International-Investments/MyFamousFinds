// FILE: /pages/seller/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Example of how you might conditionally show onboarding
const isVettingApproved = true;
const isProfileComplete = false;

export default function SellerDashboard() {
  return (
    <>
      <Head>
        <title>Seller Console — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-white text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          {/* Heading */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Console
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your listings, orders, and payouts in one place.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Storefront
            </Link>
          </div>

          {/* -- 1. ONBOARDING (Conditional) -- */}
          {/* Show this if seller is approved but hasn't filled in bank/tax info */}
          {isVettingApproved && !isProfileComplete && (
            <section className="mb-10">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Welcome to Famous Finds!
                </h2>
                <p className="text-sm text-gray-600">
                  Your application is approved. Please complete your profile to
                  start selling.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Link
                  href="/seller/register-complete"
                  className="group flex flex-col justify-between rounded-lg border-2 border-blue-500 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600">
                      Complete Your Profile
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      Add your banking, tax (W-9), and business details to
                      receive payouts.
                    </p>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-blue-600 group-hover:text-blue-500">
                    Go to setup →
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* -- 2. LISTINGS -- */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Listings
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Link
                href="/sell"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Create New Listing
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Upload a new item to your catalogue.
                  </p>
                </div>
                <div className="mt-3 text-xs text-blue-600 group-hover:text-blue-500">
                  Start listing →
                </div>
              </Link>
              <Link
                href="/seller/catalogue"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    My Catalogue
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Edit prices, quantity, and details for your active
                    listings.
                  </p>
                </div>
                <div className="mt-3 text-xs text-blue-600 group-hover:text-blue-500">
                  View catalogue →
                </div>
              </Link>
              <Link
                href="/seller/bulk-upload"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Bulk Upload
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Upload many items at once using our CSV template.
                  </p>
                </div>
                <div className="mt-3 text-xs text-blue-600 group-hover:text-blue-500">
                  Open bulk tools →
                </div>
              </Link>
            </div>
          </section>

          {/* -- 3. ORDERS & PERFORMANCE -- */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders & Performance
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Link
                href="/seller/orders"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Orders
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    View new, in-transit, and delivered orders.
                  </p>
                </div>
                <div className="mt-3 text-xs text-emerald-600 group-hover:text-emerald-500">
                  Go to orders →
                </div>
              </Link>
              <Link
                href="/seller/insights"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Insights
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Track your sales, top products, and performance.
                  </p>
                </div>
                <div className="mt-3 text-xs text-emerald-600 group-hover:text-emerald-500">
                  View insights →
                </div>
              </Link>
            </div>
          </section>

          {/* -- 4. FINANCE & ACCOUNT -- */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Finance & Account
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Link
                href="/seller/wallet"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Wallet & Payouts
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    See your available balance and payout history.
                  </p>
                </div>
                <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                  Open wallet →
                </div>
              </Link>
              <Link
                href="/seller/statements"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Statements
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Download monthly financial statements for your records.
                  </p>
                </div>
                <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                  View statements →
                </div>
              </Link>
              <Link
                href="/seller/profile"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-500 hover:shadow-md"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Seller Profile
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Update your business details and bank information.
                  </p>
                </div>
                <div className="mt-3 text-xs text-gray-600 group-hover:text-gray-500">
                  Edit profile →
                </div>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
