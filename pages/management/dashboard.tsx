// FILE: /pages/management/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { GetServerSideProps } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

type MgmtStats = {
  sellers: number;
  pendingSellers: number;
  listings: number;
  pendingListings: number;
  orders: number;
  pendingOrders: number;
};

type Props = {
  stats: MgmtStats;
};

export default function ManagementDashboard({ stats }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Management Dashboard — Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Management Console</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor marketplace activity, applications, and live orders.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Storefront
          </Link>
        </div>

        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Summary
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Sellers</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.sellers.toLocaleString("en-AU")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingSellers} pending vetting
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Listings</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.listings.toLocaleString("en-AU")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingListings} awaiting review
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-500">Orders</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.orders.toLocaleString("en-AU")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingOrders} in progress
              </p>
            </div>
          </div>
        </section>

        {/* Navigation tiles */}
        <section className="grid gap-5 md:grid-cols-3">
          <Link
            href="/management/vetting-queue"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-blue-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Seller Vetting Queue
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Review and approve new seller applications ({stats.pendingSellers} pending).
            </p>
          </Link>

          <Link
            href="/management/sellers"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-green-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Seller Directory
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              View {stats.sellers} active sellers on the platform.
            </p>
          </Link>

          <Link
            href="/management/listings"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-yellow-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Listings Review
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {stats.pendingListings} pending and {stats.listings} total listings.
            </p>
          </Link>

          <Link
            href="/management/orders"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Orders Monitor
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Track {stats.pendingOrders} active orders, {stats.orders} total.
            </p>
          </Link>

          <Link
            href="/management/statements"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-gray-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Statements & Payouts
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Export platform-wide payout reports.
            </p>
          </Link>

          <Link
            href="/management/settings"
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:border-gray-400 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Platform Settings
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure categories, fees, and verification settings.
            </p>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [sellersSnap, pendingSellersSnap, listingsSnap, pendingListingsSnap, ordersSnap, pendingOrdersSnap] =
      await Promise.all([
        adminDb.collection("sellers").get(),
        adminDb.collection("sellers").where("status", "==", "Pending").get(),
        adminDb.collection("listings").get(),
        adminDb.collection("listings").where("status", "==", "PendingReview").get(),
        adminDb.collection("orders").get(),
        adminDb.collection("orders").where("status", "in", ["Pending", "Processing"]).get(),
      ]);

    const stats: MgmtStats = {
      sellers: sellersSnap.size,
      pendingSellers: pendingSellersSnap.size,
      listings: listingsSnap.size,
      pendingListings: pendingListingsSnap.size,
      orders: ordersSnap.size,
      pendingOrders: pendingOrdersSnap.size,
    };

    return { props: { stats } };
  } catch (err) {
    console.error("Error loading management dashboard:", err);
    const empty: MgmtStats = {
      sellers: 0,
      pendingSellers: 0,
      listings: 0,
      pendingListings: 0,
      orders: 0,
      pendingOrders: 0,
    };
    return { props: { stats: empty } };
  }
};
