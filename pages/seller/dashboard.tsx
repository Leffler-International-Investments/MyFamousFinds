// FILE: /pages/seller/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { ReactNode } from "react";
import SellerDashboardTutorial from "../../components/SellerDashboardTutorial";
import { useRequireSeller } from "../../hooks/useRequireSeller";

const DashboardSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
    <div className="grid gap-4 md:grid-cols-3">{children}</div>
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
  const colors: Record<string, string> = {
    blue: "border-gray-200 hover:border-blue-500",
    green: "border-gray-200 hover:border-emerald-500",
    gray: "border-gray-200 hover:border-gray-500",
  };
  const textColors: Record<string, string> = {
    blue: "text-blue-600 group-hover:text-blue-500",
    green: "text-emerald-600 group-hover:text-emerald-500",
    gray: "text-gray-600 group-hover:text-gray-500",
  };

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-lg border bg-gray-50 p-4 text-sm shadow-sm transition-all hover:bg-white hover:shadow-md ${colors[accentColor]}`}
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-600">{description}</p>
      </div>
      <div className={`mt-3 text-xs font-semibold ${textColors[accentColor]}`}>
        Go to page →
      </div>
    </Link>
  );
};

export default function SellerDashboard() {
  const { loading: authLoading } = useRequireSeller();

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <>
      <Head>
        <title>Seller Console — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Console
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your listings, orders, and payouts in one place.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Storefront
            </Link>
          </div>

          <SellerDashboardTutorial />

          {/* Onboarding banner */}
          <section className="mb-8 rounded-lg border-2 border-blue-500 bg-white p-5 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Welcome to Famous Finds!
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Your seller application is approved. Please complete your profile
              to start listing items and receiving USD payouts.
            </p>
            <div>
              <Link
                href="/seller/profile"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Complete your profile →
              </Link>
            </div>
          </section>

          {/* Manage listings */}
          <DashboardSection title="Manage listings">
            <DashboardLink
              href="/seller/bulk-upload"
              title="Upload listings"
              description="Add a single listing or upload many at once via CSV. Authenticity fields and photos required."
              accentColor="blue"
            />
            <DashboardLink
              href="/seller/catalogue"
              title="My catalogue"
              description="View and edit your active, pending, and rejected listings."
              accentColor="blue"
            />
          </DashboardSection>

          {/* Orders & performance */}
          <DashboardSection title="Orders & performance">
            <DashboardLink
              href="/seller/orders"
              title="Orders"
              description="Review new orders, see buyer details, and track shipping status."
              accentColor="green"
            />
            <DashboardLink
              href="/seller/insights"
              title="Seller insights"
              description="See brand performance, sell-through, and pricing suggestions."
              accentColor="green"
            />
          </DashboardSection>

          {/* Finance & account */}
          <DashboardSection title="Finance & account">
            <DashboardLink
              href="/seller/wallet"
              title="Wallet & payouts"
              description="Check your available balance, upcoming payouts, and payout history (USD)."
              accentColor="gray"
            />
            <DashboardLink
              href="/seller/statements"
              title="Statements"
              description="Download monthly sales and fee statements for your records."
              accentColor="gray"
            />
            <DashboardLink
              href="/seller/profile"
              title="Seller profile"
              description="Update your business details and manage Stripe payout settings."
              accentColor="gray"
            />
          </DashboardSection>
        </main>

        <Footer />
      </div>
    </>
  );
}
