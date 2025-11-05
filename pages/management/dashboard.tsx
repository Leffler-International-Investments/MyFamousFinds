// FILE: /pages/management/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ButlerChat from "../../components/ButlerChat";
import type React from "react";

// Helper component for dashboard sections
const DashboardSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  // This <section> is the white styled box
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

export default function ManagementDashboard() {
  return (
    // This div provides the light gray background for the whole page
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Management Admin Dashboard — Famous Finds</title>
      </Head>

      <Header />

      {/* This main element centers the content */}
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

        {/* --- SELLER MANAGEMENT --- */}
        <DashboardSection title="Seller Management">
          <DashboardLink
            href="/management/vetting-queue"
            title="Seller Vetting Queue"
            description="Approve or deny new seller applications."
          />
          <DashboardLink
            href="/management/sellers"
            title="Seller Directory"
            description="View and manage all active sellers."
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
            href="/management/listing-review"
            title="Listing Review Queue"
            description="Approve or deny new product listings."
          />
          <DashboardLink
            href="/management/listings"
            title="All Listings"
            description="View and manage all products on the platform."
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
            href="/management/content/homepage"
            title="Content Management"
            description="Edit static pages, banners, and promotions."
          />
        </DashboardSection>

        {/* --- OPERATIONS & FINANCE --- */}
        <DashboardSection title="Operations & Finance">
          <DashboardLink
            href="/management/orders"
            title="Orders Overview"
            description="Search and view all platform orders."
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
            href="/management/system-settings"
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
        </DashboardSection>
      </main>

      <ButlerChat />
      <Footer />
    </div>
  );
}
