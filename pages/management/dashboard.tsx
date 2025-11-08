// FILE: /pages/management/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ButlerChat from "../../components/ButlerChat";
import type { GetServerSideProps } from "next";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import type React from "react";
import ManagementDashboardTutorial from "../../components/ManagementDashboardTutorial";

type MgmtStats = {
  sellers: number;
  pendingSellers: number;
  listings: number;
  pendingListings: number;
  orders: number;
  pendingOrders: number;
};

type Props = { stats: MgmtStats };

const DashboardSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{children}</div>
  </section>
);

const DashboardTile = ({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) => (
  <Link
    href={href}
    className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm text-gray-800 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
  >
    <p className="font-semibold text-gray-900">{title}</p>
    <p className="mt-1 text-xs text-gray-600">{description}</p>
  </Link>
);

export default function ManagementDashboard({ stats }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Management Dashboard — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Management dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of sellers, listings, orders, and support activity.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            ← Back to marketplace
          </Link>
        </div>

        <ManagementDashboardTutorial />

        {/* Live summary */}
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Summary
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {/* Sellers tile */}
            <Link
              href="/management/sellers"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
            >
              <p className="text-xs uppercase text-gray-500">Sellers</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.sellers.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingSellers} pending vetting
              </p>
            </Link>

            {/* Listings tile */}
            <Link
              href="/management/listings"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
            >
              <p className="text-xs uppercase text-gray-500">Listings</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.listings.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingListings} awaiting review
              </p>
            </Link>

            {/* Orders tile */}
            <Link
              href="/management/orders"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
            >
              <p className="text-xs uppercase text-gray-500">Orders</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.orders.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingOrders} in progress
              </p>
            </Link>
          </div>
        </section>

        {/* Seller management */}
        <DashboardSection title="Seller Management">
          <DashboardTile
            title="Seller Vetting Queue"
            description="Approve or deny new seller applications."
            href="/management/vetting-queue"
          />
          <DashboardTile
            title="Seller Directory"
            description="View and manage all active sellers."
            href="/management/sellers"
          />
          <DashboardTile
            title="Seller Profiles / Controls"
            description="Edit seller details, statuses, and permissions."
            href="/management/seller-profiles"
          />
        </DashboardSection>

        {/* Product & content */}
        <DashboardSection title="Product & Content">
          <DashboardTile
            title="Listing Review Queue"
            description="Check pending listings (Prada bag, LV sneakers, etc.) and approve or reject."
            href="/management/listing-queue"
          />
          <DashboardTile
            title="All Listings"
            description="View and manage all products on the platform."
            href="/management/listings"
          />
          <DashboardTile
            title="Categories & Attributes"
            description="Manage product categories and metadata."
            href="/management/categories"
          />
        </DashboardSection>

        {/* Finance */}
        <DashboardSection title="Operations & Finance">
          <DashboardTile
            title="Orders Overview"
            description="Search and manage platform orders."
            href="/management/orders"
          />
          <DashboardTile
            title="Returns & Disputes"
            description="Handle returns, disputes, and chargebacks."
            href="/management/disputes"
          />
          <DashboardTile
            title="Payouts & Finance"
            description="Review seller payouts and fees."
            href="/management/payouts"
          />
          <DashboardTile
            title="Tax & Compliance"
            description="US-style sales and tax reporting."
            href="/management/tax"
          />
          <DashboardTile
            title="Stripe & Payment Settings"
            description="Configure Stripe keys and payment settings."
            href="/management/stripe-settings"
          />
        </DashboardSection>

        {/* Platform & support */}
        <DashboardSection title="Platform & Support">
          <DashboardTile
            title="Analytics & Reports"
            description="Platform-wide sales and traffic insights."
            href="/management/analytics"
          />
          <DashboardTile
            title="Support Tickets"
            description="View and respond to user support requests."
            href="/management/support-tickets"
          />
          <DashboardTile
            title="System Settings"
            description="Configure global regions and currencies."
            href="/management/system-settings"
          />
          <DashboardTile
            title="Logs & Audit Trail"
            description="System and admin action logs."
            href="/management/logs"
          />
          <DashboardTile
            title="User & Role Management"
            description="Manage admin users and permissions."
            href="/management/users"
          />
          <DashboardTile
            title="Management Team"
            description="Add or remove admins and assign access."
            href="/management/team"
          />
          <DashboardTile
            title="Developer / Integrations"
            description="API keys and third-party integrations."
            href="/management/developer"
          />
        </DashboardSection>
      </main>

      <ButlerChat />
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [
      sellersSnap,
      pendingSellersSnap,
      listingsSnap,
      pendingListingsSnap,
      ordersSnap,
      pendingOrdersSnap,
    ] = await Promise.all([
      adminDb.collection("sellers").get(),
      adminDb
        .collection("sellers")
        .where("status", "==", "Pending")
        .get(),
      adminDb.collection("listings").get(),
      // ✅ count both Pending and legacy PendingReview
      adminDb
        .collection("listings")
        .where("status", "in", ["Pending", "PendingReview"])
        .get(),
      adminDb.collection("orders").get(),
      adminDb
        .collection("orders")
        .where("status", "in", ["Pending", "Processing", "Paid"])
        .get(),
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
    console.error("Error loading management stats", err);
    const stats: MgmtStats = {
      sellers: 0,
      pendingSellers: 0,
      listings: 0,
      pendingListings: 0,
      orders: 0,
      pendingOrders: 0,
    };
    return { props: { stats } };
  }
};
