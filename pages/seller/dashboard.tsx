// FILE: /pages/seller/dashboard.tsx
// Seller dashboard.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React from "react";
import type { ReactNode } from "react";
import SellerDashboardTutorial from "../../components/SellerDashboardTutorial";
import { useRequireSeller } from "../../hooks/useRequireSeller";

/* ───────── Dashboard helper components ───────── */

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
  const linkColorClass =
    accentColor === "green"
      ? "dashboard-tile-link-green"
      : accentColor === "gray"
      ? "dashboard-tile-link-gray"
      : "dashboard-tile-link-blue";

  return (
    <Link href={href} className="dashboard-tile">
      <div>
        <h3 className="dashboard-tile-title">{title}</h3>
        <p className="dashboard-tile-description">{description}</p>
      </div>
      <div className={`dashboard-tile-link ${linkColorClass}`}>Go to page →</div>
    </Link>
  );
};

/* ───────── Main Dashboard ───────── */

export default function SellerDashboard() {
  const { loading: authLoading } = useRequireSeller();

  if (authLoading) {
    return <div className="dashboard-page" />;
  }

  return (
    <>
      <Head>
        <title>Seller Console - Famous Finds</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Console</h1>
              <p>Manage your listings, orders, and payouts in one place.</p>
            </div>
            <Link href="/">Back to Storefront</Link>
          </div>

          <SellerDashboardTutorial />

          {(
            <section className="dashboard-welcome-banner">
              <h2>Welcome to Famous Finds!</h2>
              <p>
                Your application is approved. Please complete your banking
                details to start receiving payouts.
              </p>
              <div>
                <Link
                  href="/seller/banking"
                  className="dashboard-welcome-banner-button"
                >
                  Set up banking &amp; payouts →
                </Link>
              </div>
            </section>
          )}

          <DashboardSection title="Manage Listings">
            <DashboardLink
              href="/seller/bulk-simple"
              title="Create New Listing"
              description="Add items with dropdowns and image uploads."
              accentColor="blue"

            />
            <DashboardLink
              href="/seller/catalogue"
              title="My Catalogue"
              description="Edit prices, quantity, and details for your active listings."
              accentColor="blue"

            />
          </DashboardSection>

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

          <DashboardSection title="Finance & Account">
            <DashboardLink
              href="/seller/banking"
              title="Banking & Payouts"
              description="Set your PayPal email and control payout schedule."
              accentColor="gray"

            />
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
              description="Update your business details and public shop info."
              accentColor="gray"

            />
          </DashboardSection>
        </main>
        <Footer />
      </div>

      <style jsx global>{``}</style>
    </>
  );
}
