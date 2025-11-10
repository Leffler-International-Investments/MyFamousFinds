// FILE: /pages/management/dashboard.tsx
// This version uses the custom CSS classes from globals.css
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

// Helper component for dashboard sections
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

// Helper component for dashboard tiles
const DashboardTile = ({
  title,
  description,
  href,
  linkText = "View", // Default link text
  linkColor = "blue", // Default color
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
    {/* ADDED link text and color logic */}
    <p className={`dashboard-tile-link dashboard-tile-link-${linkColor}`}>
      {linkText} &rarr;
    </p>
  </Link>
);

export default function ManagementDashboard({ stats }: Props) {
  const { loading } = useRequireAdmin();

  if (loading) return null;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Management Dashboard - Famous Finds</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        {/* Page heading */}
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

        {/* Live summary tiles */}
        <section className="dashboard-summary-section">
          <h2>Live Summary</h2>
          <div className="dashboard-summary-grid">
            {/* Sellers tile */}
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
            {/* Listings tile */}
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
            {/* Orders tile */}
            <Link href="/management/orders" className="dashboard-summary-tile">
              <p className="label">Orders</p>
              <p className="stat">{stats.orders.toLocaleString("en-US")}</p>
              <p className="sub-stat">{stats.pendingOrders} in progress</p>
            </Link>
          </div>
        </section>

        {/* 1. Product Approval Process */}
        <DashboardSection
          title="Product Approval Process"
          subtitle="From new seller listing review → live products. Start here to control what appears on the site."
        >
          <DashboardTile
            title="Listing Review Queue"
            description="Review and approve new product listings (Prada bag, LV sneakers, etc.) before they go live."
            href="/management/listing-queue"
            linkText="Review Listings"
            linkColor="blue"
          />
          <DashboardTile
            title="Seller Vetting Queue"
            description="Approve or deny new seller applications. Only approved sellers can list products."
            href="/management/vetting-queue"
            linkText="Review Sellers"
            linkColor="blue"
          />
          <DashboardTile
            title="All Listings"
            description="View and moderate all products across the marketplace (Live, Pending, Rejected)."
            href="/management/listings"
            linkText="Manage Listings"
            linkColor="gray"
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
            linkText="Manage Categories"
            linkColor="gray"
          />
          <DashboardTile
            title="System Settings"
            description="Configure global settings like regions, default currency (USD), and feature flags."
            href="/management/system-settings"
            linkText="Configure Settings"
            linkColor="gray"
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
            linkText="View Directory"
            linkColor="gray"
          />
          <DashboardTile
            title="Seller Profiles / Controls"
            description="Edit individual seller details, statuses, risk flags, and internal notes."
            href="/management/seller-profiles"
            linkText="Edit Profiles"
            linkColor="gray"
          }
          />
          <DashboardTile
            title="Management Team"
            description="Add or remove internal admins and decide who can access finance, vetting, or support."
            href="/management/team"
            linkText="Manage Team"
            linkColor="gray"
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
            linkText="Manage Orders"
            linkColor="blue"
          />
          <DashboardTile
            title="Returns & Disputes"
            description="Handle returns, chargebacks, and buyer-seller disputes."
            href="/management/disputes"
            linkText="Handle Disputes"
            linkColor="gray"
          />
          <DashboardTile
            title="Payouts & Finance"
            description="Monitor seller payouts, platform fees, and payment status (USD)."
            href="/management/payouts"
            linkText="View Finance"
            linkColor="green"
          />
          <DashboardTile
            title="Tax & Compliance (US)"
            description="View annual US-dollar sales per seller and track whether tax forms are issued."
            href="/management/tax"
            linkText="View Tax Info"
            linkColor="green"
          />
          <DashboardTile
            title="Stripe & Payment Settings"
            description="Configure Stripe keys and payment-related settings."
            href="/management/stripe-settings"
            linkText="Configure Stripe"
            linkColor="green"
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
            linkText="View Analytics"
            linkColor="gray"
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
            description="Manage admin accounts and their roles (operations, finance, support, etc.)."
            href="/management/users"
            linkText="Manage Users"
            linkColor="gray"
          />
          <DashboardTile
            title="Developer / Integrations"
            description="API keys and integrations with external tools and services."
            href="/management/developer"
            linkText="View Integrations"
Clickable
            linkColor="gray"
          />
        </DashboardSection>

        {/* --- 6. NEW VIP CLUB MANAGEMENT SECTION --- */}
        <DashboardSection
          title="VIP Club Management"
          subtitle="Manage 'Front Row' members, points, and tiers."
        >
          <DashboardTile
            title="VIP Member Directory"
            description="View all VIP members, search by tier, and adjust loyalty points."
            href="/management/vip-members"
            linkText="Manage Members"
            linkColor="gold"
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
      // Note: Switched to 'users' collection for sellers
      adminDb.collection("users").where("role", "==", "seller").get(),
      adminDb
        .collection("users")
        .where("role", "==", "seller")
        .where("status", "==", "Pending")
        .get(),
      adminDb.collection("listings").get(),
      adminDb
        .collection("listings")
        // count both modern and older "PendingReview" statuses
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
