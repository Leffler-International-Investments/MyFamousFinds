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
      {subtitle && (
        <p className="dashboard-section-subtitle">{subtitle}</p>
      )}
    </div>
    <div className="dashboard-grid">{children}</div>
  </section>
);

// Helper component for dashboard tiles
const DashboardTile = ({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) => (
  <Link href={href} className="dashboard-tile">
    <p className="dashboard-tile-title">{title}</p>
    <p className="dashboard-tile-description">{description}</p>
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
              <p className
