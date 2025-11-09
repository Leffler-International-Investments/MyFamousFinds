// FILE: /pages/seller/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { ReactNode } from "react";
// --- 1. ADDED IMPORTS ---
import SellerDashboardTutorial from "../../components/SellerDashboardTutorial";
import { useRequireSeller } from "../../hooks/useRequireSeller";

// Helper component for dashboard sections
const DashboardSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="dashboard-section">
    <div className="dashboard-section-header">
      <h2 className="dashboard-section-title">{title}</h2>
    </div>
    <div className="dashboard-grid">{children}</div>
  </section>
);

// Helper component for dashboard links
const DashboardLink = ({
  href,
  title,
  description,
  accentColor = "blue",
}: {
  href: string;
  title: string;
  description: string;
  accentColor?: "blue" | "green" | "gray";
}) => {
  // We can use the accentColor to pick the right class
  const linkColorClass = 
    accentColor === 'green' ? 'dashboard-tile-link-green' :
    accentColor === 'gray' ? 'dashboard-tile-link-gray' :
    'dashboard-tile-link-blue';

  return (
    <Link
      href={href}
      className="dashboard-tile"
    >
      <div>
        <h3 className="dashboard-tile-title">{title}</h3>
        <p className="dashboard-tile-desc">{description}</p>
      </div>
      <div className={`dashboard-tile-link ${linkColorClass}`}>
        Go to page →
      </div>
    </Link>
  );
};

export default function SellerDashboard() {
  // --- 2. ADDED SECURITY HOOK ---
  const { loading: authLoading } = useRequireSeller();
  
  if (authLoading) {
    return <div className="dashboard-page"></div>;
  }

  return (
    <>
      <Head>
        <title>Seller Console — Famous Finds</title>
      </Head>
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>
                Seller Console
              </h1>
              <p>
                Manage your listings, orders, and payouts in one place.
              </p>
            </div>
            <Link
              href="/"
            >
              ← Back to Storefront
            </Link>
          </div>

          {/* --- 3. ADDED TUTORIAL COMPONENT --- */}
          <SellerDashboardTutorial />

          {/* Onboarding banner */}
          <section className="seller-welcome-banner">
            <h2>
              Welcome to Famous Finds!
            </h2>
            <p>
              Your application is approved. Please complete your profile to
              start selling.
            </p>
            <div>
              <Link
                href="/seller/profile"
                className="seller-welcome-banner-button"
              >
                Complete Your Profile →
              </Link>
            </div>
          </section>

          {/* Manage Listings */}
          <DashboardSection title="Manage Listings">
            <DashboardLink
              href="/sell"
              title="Create New Listing"
              description="Upload a new item to your catalogue."
              accentColor="blue"
            />
            <DashboardLink
              href="/seller/catalogue"
              title="My Catalogue"
              description="Edit prices, quantity, and details for your active listings."
              accentColor="blue"
            />
            <DashboardLink
              href="/seller/bulk-upload"
              title="Bulk Upload"
              description="Upload many items at once using our CSV template."
              accentColor="blue"
            />
          </DashboardSection>

          {/* Orders & Performance */}
          <DashboardSection title="Orders & Performance">
            <DashboardLink
              href="/seller/orders"
              title="Orders"
              description="View new, in-transit, and delivered orders."
              accentColor="green"
            />
            <DashboardLink
              href="/seller/insights"
              title="Insights"
              description="Track your sales, top products, and performance."
              accentColor="green"
            />
          </DashboardSection>

          {/* Finance & Account */}
          <DashboardSection title="Finance & Account">
            <DashboardLink
              href="/seller/wallet"
              title="Wallet & Payouts"
              description="See your available balance and payout history."
              accentColor="gray"
            />
            <DashboardLink
              href="/seller/statements"
              title="Statements"
              description="Download monthly financial statements for your records."
              accentColor="gray"
            />
            <DashboardLink
              href="/seller/profile"
              title="Seller Profile"
              description="Update your business details and bank information."
              accentColor="gray"
            />
          </DashboardSection>
        </main>

        <Footer />
      </div>
    </>
  );
  
}
