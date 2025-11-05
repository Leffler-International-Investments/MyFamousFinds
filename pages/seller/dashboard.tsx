// FILE: /pages/seller/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";

export default function SellerDashboard() {
  const { loading } = useRequireSeller();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Console — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Seller Console
            </h1>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Storefront
            </Link>
          </div>

          {/* Welcome banner */}
          <section className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
            <h2 className="text-sm font-semibold text-blue-900">
              Welcome to Famous Finds!
            </h2>
            <p className="mt-1 text-sm text-blue-900/80">
              Your application is approved. Please complete your profile to
              start selling.
            </p>
            <div className="mt-3">
              <Link
                href="/seller/profile"
                className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Complete Your Profile →
              </Link>
            </div>
          </section>

          {/* Manage Listings */}
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Manage Listings
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <DashboardCard
                title="Create New Listing"
                description="Upload a new item to your catalogue."
                href="/seller/listings/new"
              />
              <DashboardCard
                title="My Catalogue"
                description="Edit prices, quantity, and details for your active listings."
                href="/seller/listings"
              />
              <DashboardCard
                title="Bulk Upload"
                description="Upload many items at once using our CSV template."
                href="/seller/bulk-upload"
              />
            </div>
          </section>

          {/* Orders & Performance */}
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Orders & Performance
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <DashboardCard
                title="Orders"
                description="View new, in-transit, and delivered orders."
                href="/seller/orders"
              />
              <DashboardCard
                title="Insights"
                description="Track your sales, top products, and performance."
                href="/seller/insights"
              />
            </div>
          </section>

          {/* Finance & Account */}
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              Finance &amp; Account
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <DashboardCard
                title="Wallet & Payouts"
                description="See your available balance and payout history."
                href="/seller/wallet"
              />
              <DashboardCard
                title="Statements"
                description="Download monthly financial statements for your records."
                href="/seller/statements"
              />
              <DashboardCard
                title="Seller Profile"
                description="Update your business details and bank information."
                href="/seller/profile"
              />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

function DashboardCard(props: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-md border border-gray-200 bg-gray-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {props.title}
        </h3>
        <p className="mt-1 text-xs text-gray-600">{props.description}</p>
      </div>
      <div className="mt-3">
        <Link
          href={props.href}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Go to page →
        </Link>
      </div>
    </div>
  );
}
