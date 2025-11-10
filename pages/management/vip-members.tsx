// FILE: /pages/management/vip-members.tsx
// This is a new placeholder page for you to build on.
import Head from "next/head";
import Link from "next/link";
import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function VipMembersPage() {
  const { loading } = useRequireAdmin();

  if (loading) {
    return (
      <div className="dashboard-page">
        <Head>
          <title>VIP Members - Management</title>
        </Head>
        <Header />
        <main className="dashboard-main">
          <p>Checking admin access...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Head>
        <title>VIP Members - Management</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        {/* Page heading */}
        <div className="dashboard-header">
          <div>
            <h1>VIP Club Management</h1>
            <p>
              View members, search, filter by tier, and adjust loyalty points.
            </p>
          </div>
          <Link href="/management/dashboard">Back to dashboard</Link>
        </div>

        {/* Placeholder Content */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">VIP Member Directory</h2>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">
              This is the placeholder page for managing your VIP members.
            </Fp>
            <p className="mt-4 text-gray-600">
              From here, you will be able to:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-600">
              <li>See a list of all users with a "vipTier" field.</li>
              <li>Filter by "Bronze", "Silver", and "Gold" tiers.</li>
              <li>Search for a member by name or email.</li>
              <li>Manually add or remove loyalty points.</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
