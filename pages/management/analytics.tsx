// FILE: /pages/management/analytics.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Metric = {
  label: string;
  value: string;
  note?: string;
};

const METRICS: Metric[] = [
  {
    label: "GMV (Last 30 days)",
    value: "$0",
    note: "Live GMV will appear once orders are flowing through the system.",
  },
  {
    label: "Active Sellers",
    value: "0",
    note: "Sellers will be counted automatically when onboarded and verified.",
  },
  {
    label: "Active Listings",
    value: "0",
    note: "Listings will appear here once items are approved for sale.",
  },
  {
    label: "Dispute Rate",
    value: "0.0%",
    note: "Disputes and chargebacks will be tracked as your marketplace runs.",
  },
];

export default function ManagementAnalytics() {
  const { loading } = useRequireAdmin();

  // While we check admin access, keep the same frame but show a lightweight message
  if (loading) {
    return (
      <>
        <Head>
          <title>Analytics &amp; Reports — Admin</title>
        </Head>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-10">
            <p className="text-sm text-gray-600">Checking admin access…</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics &amp; Reports — Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Analytics &amp; Reports
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                High-level KPIs for buyers, sellers, orders, and marketplace
                health.
              </p>
            </div>

            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Metric cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {m.value}
                </p>
                {m.note && (
                  <p className="mt-1 text-xs text-gray-500 leading-snug">
                    {m.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Downloads section */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-gray-900">Downloads</h2>
            <p className="mt-1 text-xs text-gray-600">
              Export CSV-ready reports once your orders and payouts data is
              connected. These buttons are wired into the UI and can later call
              real export endpoints.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-800 hover:border-gray-400"
              >
                Orders (Last 30 days)
              </button>

              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-800 hover:border-gray-400"
              >
                Sellers Performance
              </button>

              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-800 hover:border-gray-400"
              >
                Listings Conversion
              </button>
            </div>
          </section>

          <p className="mt-4 text-xs text-gray-500">
            This view is ready for live data. Once your orders, payouts and
            disputes are stored in your database (for example, in Firestore or a
            warehouse), you can plug in real metrics here or connect the same
            data to BI tools such as BigQuery or Metabase.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}
