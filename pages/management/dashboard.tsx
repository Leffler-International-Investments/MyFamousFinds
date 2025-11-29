// FILE: /pages/management/dashboard.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import type React from "react";
import { useState } from "react";
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
  <section className="dashboard-section">
    <div className="dashboard-section-header">
      <h2 className="dashboard-section-title">{title}</h2>
      {subtitle && <p className="dashboard-section-subtitle">{subtitle}</p>}
    </div>
    <div className="dashboard-grid">{children}</div>
  </section>
);

const DashboardTile = ({
  title,
  description,
  href,
  linkText,
  linkColor = "blue",
}: {
  title: string;
  description: string;
  href: string;
  linkText?: string;
  linkColor?: "blue" | "green" | "gray" | "gold";
}) => (
  <Link href={href} className="dashboard-tile">
    <p className="dashboard-tile-title">{title}</p>
    <p className="dashboard-tile-description">{description}</p>
    <p className={`dashboard-tile-link dashboard-tile-link-${linkColor}`}>
      {linkText || "Go →"}
    </p>
  </Link>
);

export default function ManagementDashboard({ stats }: Props) {
  const { loading } = useRequireAdmin();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (loading) return null;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Management Dashboard - Famous Finds</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Management dashboard</h1>
            <p>
              Control centre for sellers, listings, orders, payouts, and
              support.
            </p>
          </div>
          <Link href="/">Back to marketplace</Link>
        </div>

        <ManagementDashboardTutorial />

        <section className="dashboard-welcome-banner">
          <h2>Team payouts setup</h2>
          <p>
            Before paying salaries or fees to the management team, connect your
            payout account and set your payout preferences.
          </p>
          <div>
            <Link
              href="/management/banking"
              className="dashboard-welcome-banner-button"
            >
              Configure management banking →
            </Link>
          </div>
        </section>

        <section className="dashboard-summary-section">
          <h2>Live Summary</h2>
          <div className="dashboard-summary-grid">
            <Link
              href="/management/sellers"
              className="dashboard-summary-tile"
            >
              <p className="label">Sellers</p>
              <p className="stat">{stats.sellers.toLocaleString("en-US")}</p>
              <p className="sub-stat">
                {stats.pendingSellers} pending vetting
              </p>
            </Link>
            <Link
              href="/management/listings"
              className="dashboard-summary-tile"
            >
              <p className="label">Listings</p>
              <p className="stat">{stats.listings.toLocaleString("en-US")}</p>
              <p className="sub-stat">
                {stats.pendingListings} awaiting review
              </p>
            </Link>
            <Link href="/management/orders" className="dashboard-summary-tile">
              <p className="label">Orders</p>
              <p className="stat">{stats.orders.toLocaleString("en-US")}</p>
              <p className="sub-stat">{stats.pendingOrders} in progress</p>
            </Link>
          </div>
        </section>

        <DashboardSection
          title="Product Approval Process"
          subtitle="From new seller listing review → live products. Start here to control what appears on the site."
        >
          <DashboardTile
            title="Listing Review Queue"
            description="Review and approve new product listings before they go live."
            href="/management/listing-queue"
            linkText="Review Listings"
            linkColor="green"
          />
          <DashboardTile
            title="Seller Vetting Queue"
            description="Approve or deny new seller applications. Only approved sellers can list products."
            href="/management/vetting-queue"
            linkText="Review Sellers"
            linkColor="green"
          />
          <DashboardTile
            title="All Listings"
            description="View and moderate all products across the marketplace."
            href="/management/listings"
            linkText="View All"
            linkColor="gray"
          />
        </DashboardSection>

        <DashboardSection
          title="VIP Club Management"
          subtitle="Manage 'Front Row' VIP members, points, and reward tiers."
        >
          <DashboardTile
            title="VIP Member Directory"
            description="View all VIP members, search by email, and see their points and tier status."
            href="/management/vip-members"
            linkText="Manage Members"
            linkColor="gold"
          />
        </DashboardSection>

        <DashboardSection
          title="Seller Management Control"
          subtitle="Keep track of who is selling on Famous Finds and adjust their permissions."
        >
          <DashboardTile
            title="Seller Directory"
            description="View and manage all active sellers, including their total listings and activity."
            href="/management/sellers"
            linkText="View Directory"
            linkColor="blue"
          />
          <DashboardTile
            title="Seller Profiles / Controls"
            description="Edit individual seller details, statuses, risk flags, and internal notes."
            href="/management/seller-profiles"
            linkText="Edit Profiles"
            linkColor="gray"
          />
          <DashboardTile
            title="Management Team"
            description="Add or remove internal admins and decide who can access finance, vetting, or support."
            href="/management/team"
            linkText="Manage Team"
            linkColor="gray"
          />
          <DashboardTile
            title="Designers Directory"
            description="Manage the list of approved designers for seller drop-downs and bulk uploads."
            href="/management/designers"
            linkText="Manage Directory"
            linkColor="gray"
          />
          <DashboardTile
            title="Master Category Library"
            description="Control top-level categories and sub-menu items shown in the marketplace header."
            href="/management/menu"
            linkText="Edit Categories"
            linkColor="blue"
          />
        </DashboardSection>

        <DashboardSection
          title="Operations, Finance & Sales"
          subtitle="Track orders, returns, payouts, and tax in one place."
        >
          <DashboardTile
            title="Orders Overview"
            description="Search and manage all platform orders from checkout to completion or refund."
            href="/management/orders"
            linkText="View Orders"
            linkColor="blue"
          />
          <DashboardTile
            title="Returns & Disputes"
            description="Handle returns, chargebacks, and buyer-seller disputes."
            href="/management/disputes"
            linkText="Manage Disputes"
            linkColor="gray"
          />
          <DashboardTile
            title="Payouts & Finance"
            description="Monitor seller payouts, platform fees, and payment status (USD)."
            href="/management/payouts"
            linkText="View Payouts"
            linkColor="gray"
          />
          <DashboardTile
            title="Tax & Compliance (US)"
            description="View annual US-dollar sales per seller and track whether tax forms are issued."
            href="/management/tax"
            linkText="View Tax Info"
            linkColor="gray"
          />
          <DashboardTile
            title="Stripe & Payment Settings"
            description="Configure Stripe keys and payment-related settings."
            href="/management/stripe-settings"
            linkText="Configure Stripe"
            linkColor="gray"
          />
          <DashboardTile
            title="Management Banking"
            description="Set salary / fee payout rules for the management team."
            href="/management/banking"
            linkText="Configure Banking"
            linkColor="gray"
          />
        </DashboardSection>

        <DashboardSection
          title="Platform, Support & Analytics"
          subtitle="Support customers, track performance, and manage internal access."
        >
          {/* ✅ ADDED: Message Board Management Tile */}
          <DashboardTile
            title="Message Board"
            description="Create or update public announcements visible to buyers on the homepage."
            href="/management/messages"
            linkText="Manage Messages"
            linkColor="blue"
          />

          <DashboardTile
            title="Analytics & Reports"
            description="High-level sales and traffic insights across Famous Finds."
            href="/management/analytics"
            linkText="View Reports"
            linkColor="blue"
          />
          <DashboardTile
            title="Support Tickets"
            description="View and respond to customer support tickets."
            href="/management/support-tickets"
            linkText="View Tickets"
            linkColor="gray"
          />
          <DashboardTile
            title="Logs & Audit Trail"
            description="Review a history of important admin and system actions."
            href="/management/logs"
            linkText="View Logs"
            linkColor="gray"
          />
          <DashboardTile
            title="User & Role Management"
            description="Manage admin accounts and their roles."
            href="/management/users"
            linkText="Manage Users"
            linkColor="gray"
          />
          <DashboardTile
            title="Developer / Integrations"
            description="API keys and integrations with external tools and services."
            href="/management/developer"
            linkText="View Integrations"
            linkColor="gray"
          />
        </DashboardSection>
      </main>

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-black text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-gray-800 transition-all"
          aria-label="Open AI Butler"
        >
          🤵
        </button>
      )}
      <ButlerChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
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
        .where("status", "in", ["Pending", "Pending Review"])
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
