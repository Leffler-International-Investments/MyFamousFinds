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

// Types for live stats
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

// Helper component for dashboard tiles/links
const DashboardLink = ({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
}) => (
  <Link
    href={href}
    className="block rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm transition-all hover:border-blue-500 hover:bg-white hover:shadow-md"
  >
    <h3 className="font-medium text-gray-800">{title}</h3>
    {description && <p className="mt-1 text-xs text-gray-600">{description}</p>}
  </Link>
);

export default function ManagementDashboard({ stats }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="min-h-screen bg-gray-50"></div>;
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Management Admin Dashboard — Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Management Admin Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Return to Storefront
          </Link>
        </div>

        <ManagementDashboardTutorial />

        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Summary
          </h2>
          
          {/* --- THIS BLOCK IS UPDATED --- */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {/* Sellers summary card → Seller Directory */}
            <Link
              href="/management/sellers"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
            >
              <p className="text-xs uppercase text-gray-500">Sellers</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.sellers.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingSellers} pending vetting
              </p>
            </Link>
            {/* Listings summary card → All Listings */}
            <Link
              href="/management/listings"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
            >
              <p className="text-xs uppercase text-gray-500">Listings</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {stats.listings.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-500">
                {stats.pendingListings} awaiting review
              </p>
            </Link>
            {/* Orders summary card → Orders Overview */}
            <Link
              href="/management/orders"
              className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
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
          {/* --- END OF UPDATE --- */}
          
        </section>

        {/* --- SELLER MANAGEMENT --- */}
        <DashboardSection title="Seller Management">
          <DashboardLink
            href="/management/vetting-queue"
            title="Seller Vetting Queue"
            description={`Approve or deny new seller applications. (${stats.pendingSellers} pending)`}
          />
          <DashboardLink
            href="/management/sellers"
            title="Seller Directory"
            description={`View and manage all ${stats.sellers} active sellers.`}
          />
          <DashboardLink
            href="/management/seller-profiles"
            title="Seller Profiles / Controls"
            description="Edit seller details, status, and permissions."
          />
        </DashboardSection>

        {/* --- PRODUCT & CONTENT --- */}
        <DashboardSection title="Product & Content">
          <DashboardLink
            href="/management/listing-queue"
            title="Listing Review Queue"
            description={`Approve or deny new product listings. (${stats.pendingListings} pending)`}
          />
          <DashboardLink
            href="/management/listings"
            title="All Listings"
            description={`View and manage all ${stats.listings} products on the platform.`}
          />
          <DashboardLink
            href="/management/categories"
            title="Categories & Attributes"
            description="Manage product categories and metadata."
          />
          <DashboardLink
            href="/management/reviews"
            title="Reviews & Moderation"
            description="Moderate product and seller reviews."
          />
          <DashboardLink
            href="/management/content"
            title="Content Management"
            description="Edit static pages, banners, and promotions."
          />
        </DashboardSection>

        {/* --- OPERATIONS & FINANCE --- */}
        <DashboardSection title="Operations & Finance">
          <DashboardLink
            href="/management/orders"
            title="Orders Overview"
            description={`Search and view all platform orders. (${stats.pendingOrders} in progress)`}
          />
          <DashboardLink
            href="/management/disputes"
            title="Returns & Disputes"
            description="Manage customer returns and seller disputes."
          />
          <DashboardLink
            href="/management/payouts"
            title="Payouts & Finance"
            description="Review seller payouts and platform fees."
          />
          <DashboardLink
            href="/management/tax"
            title="Tax & Compliance"
            description="Manage tax settings and compliance (e.g., 1099-K forms)."
          />
          <DashboardLink
            href="/management/stripe-settings"
            title="Stripe & Payment Settings"
            description="Configure platform payment processing."
          />
        </DashboardSection>

        {/* --- PLATFORM & SUPPORT --- */}
        <DashboardSection title="Platform & Support">
          <DashboardLink
            href="/management/analytics"
            title="Analytics & Reports"
            description="View platform-wide sales and user reports."
          />
          <DashboardLink
            href="/management/support-tickets"
            title="Support Tickets"
            description="View and respond to customer support requests."
          />
          <DashboardLink
            href="/management/settings"
            title="System Settings"
            description="Configure global platform settings."
          />
          <DashboardLink
            href="/management/logs"
            title="Logs & Audit Trail"
            description="View system and admin action logs."
          />
          <DashboardLink
            href="/management/users"
            title="User & Role Management"
            description="Manage admin user accounts and roles."
          />
          <DashboardLink
            href="/management/developer"
            title="Developer / Integrations"
            description="Manage API keys and third-party integrations."
          />
          {/* --- NEW BUTTON ADDED HERE --- */}
          <Link
            href="/management/team"
            className="block rounded-lg border-2 border-blue-500 bg-blue-50 p-4 text-sm shadow-lg transition-all hover:border-blue-600 hover:bg-white"
          >
            <h3 className="font-medium text-gray-800">Management Team</h3>
            <p className="mt-1 text-xs text-gray-600">
              Add/remove admins and manage permissions.
              (Owner Only)
            </p>
          </Link>
        </DashboardSection>
      </main>

      <ButlerChat />
      <Footer />
    </div>
  );
}

// --- Live data-loading function ---
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [sellersSnap, pendingSellersSnap, listingsSnap, pendingListingsSnap, ordersSnap, pendingOrdersSnap] =
      await Promise.all([
        adminDb.collection("sellers").get(),
        adminDb.collection("sellers").where("status", "==", "Pending").get(),
        adminDb.collection("listings").get(),
        adminDb.collection("listings").where("status", "==", "PendingReview").get(),
        adminDb.collection("orders").get(),
        adminDb.collection("orders").where("status", "in", ["Pending", "Processing", "Paid"]).get(),
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
