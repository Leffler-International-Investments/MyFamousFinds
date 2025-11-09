// FILE: /pages/management/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import type React from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ButlerChat from "../../components/ButlerChat";
import ManagementDashboardTutorial from "../../components/ManagementDashboardTutorial";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

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

const DashboardSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </div>
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
        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Management dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Control centre for sellers, listings, orders, payouts, and support.
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

        {/* Live summary tiles */}
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

        {/* 1. Product Approval Process */}
        <DashboardSection
          title="Product Approval Process"
          subtitle="From new seller → listing review → live products. Start here to control what appears on the site."
        >
          <DashboardTile
            title="Listing Review Queue"
            description="Review and approve new product listings (Prada bag, LV sneakers, etc.) before they go live."
            href="/management/listing-queue"
          />
          <DashboardTile
            title="Seller Vetting Queue"
            description="Approve or deny new seller applications. Only approved sellers can list products."
            href="/management/vetting-queue"
          />
          <DashboardTile
            title="All Listings"
            description="View and moderate all products across the marketplace (Live, Pending, Rejected)."
            href="/management/listings"
          />
        </DashboardSection>

        {/* 2. Product & Content Control */}
        <DashboardSection
          title="Product & Content Control"
          subtitle="Structure how products are organised and how the marketplace appears to buyers."
        >
          <DashboardTile
            title="Categories & Attributes"
            description="Manage product categories, attributes, and how items are grouped (bags, shoes, jewelry, etc.)."
            href="/management/categories"
          />
          <DashboardTile
            title="System Settings"
            description="Configure global settings like regions, default currency (USD), and feature flags."
            href="/management/system-settings"
          />
        </DashboardSection>

        {/* 3. Seller Management Control */}
        <DashboardSection
          title="Seller Management Control"
          subtitle="Keep track of who is selling on Famous Finds and adjust their permissions."
        >
          <DashboardTile
            title="Seller Directory"
            description="View and manage all active sellers, including their total listings and activity."
            href="/management/sellers"
          />
          <DashboardTile
            title="Seller Profiles / Controls"
            description="Edit individual seller details, statuses, risk flags, and internal notes."
            href="/management/seller-profiles"
          />
          <DashboardTile
            title="Management Team"
            description="Add or remove internal admins and decide who can access finance, vetting, or support."
            href="/management/team"
          />
        </DashboardSection>

        {/* 4. Operations, Finance & Sales */}
        <DashboardSection
          title="Operations, Finance & Sales"
          subtitle="Track orders, returns, payouts, and tax in one place."
        >
          <DashboardTile
            title="Orders Overview"
            description="Search and manage all platform orders from checkout to completion or refund."
            href="/management/orders"
          />
          <DashboardTile
            title="Returns & Disputes"
            description="Handle returns, chargebacks, and buyer–seller disputes."
            href="/management/disputes"
          />
          <DashboardTile
            title="Payouts & Finance"
            description="Monitor seller payouts, platform fees, and payment status (USD)."
            href="/management/payouts"
          />
          <DashboardTile
            title="Tax & Compliance (US)"
            description="View annual US-dollar sales per seller and track whether tax forms are issued."
            href="/management/tax"
          />
          <DashboardTile
            title="Stripe & Payment Settings"
            description="Configure Stripe keys and payment-related settings."
            href="/management/stripe-settings"
          />
        </DashboardSection>

        {/* 5. Platform, Support & Analytics */}
        <DashboardSection
          title="Platform, Support & Analytics"
          subtitle="Support customers, track performance, and manage internal access."
        >
          <DashboardTile
            title="Analytics & Reports"
            description="High-level sales and traffic insights across Famous Finds."
            href="/management/analytics"
          />
          <DashboardTile
            title="Support Tickets"
            description="View and respond to customer support tickets."
            href="/management/support-tickets"
          />
          <DashboardTile
            title="Logs & Audit Trail"
            description="Review a history of important admin and system actions."
            href="/management/logs"
          />
          <DashboardTile
            title="User & Role Management"
            description="Manage admin accounts and their roles (operations, finance, support, etc.)."
            href="/management/users"
          />
          <DashboardTile
            title="Developer / Integrations"
            description="API keys and integrations with external tools and services."
            href="/management/developer"
          Failure/>
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
      adminDb.collection("sellers").where("status", "==", "Pending").get(),
      adminDb.collection("listings").get(),
      adminDb
        .collection("listings")
        // count both modern and older "PendingReview" statuses
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
