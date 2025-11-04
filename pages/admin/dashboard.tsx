// FILE: /pages/admin/dashboard.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type SellerSummary = {
  id: string;
  name: string;
  email: string;
  activeListings: number;
  pendingReview: number;
  gmv7d: string;
  disputes: number;
  status: "active" | "paused" | "under_review";
};

const kpis = [
  { label: "Active Sellers", value: "42", sub: "Sellers with at least 1 live listing" },
  { label: "Active Listings", value: "1,286", sub: "Across all categories" },
  { label: "GMV (7 days)", value: "$84,230", sub: "Gross merchandise value" },
  { label: "Orders (24h)", value: "63", sub: "Paid orders" },
  { label: "Pending Reviews", value: "18", sub: "Items waiting for approval" },
  { label: "Open Disputes", value: "5", sub: "Buyer or seller raised" },
];

const sellers: SellerSummary[] = [
  {
    id: "s001",
    name: "Luxe Closet NYC",
    email: "luxe-closet@example.com",
    activeListings: 132,
    pendingReview: 3,
    gmv7d: "$18,420",
    disputes: 0,
    status: "active",
  },
  {
    id: "s002",
    name: "Paris Archive",
    email: "paris-archive@example.com",
    activeListings: 86,
    pendingReview: 1,
    gmv7d: "$11,280",
    disputes: 1,
    status: "active",
  },
  {
    id: "s003",
    name: "Vintage Vault LA",
    email: "vintage-vault@example.com",
    activeListings: 51,
    pendingReview: 4,
    gmv7d: "$7,960",
    disputes: 2,
    status: "under_review",
  },
  {
    id: "s004",
    name: "Private Seller – M.K.",
    email: "seller-mk@example.com",
    activeListings: 9,
    pendingReview: 0,
    gmv7d: "$2,570",
    disputes: 0,
    status: "paused",
  },
];

function statusLabel(status: SellerSummary["status"]) {
  if (status === "active") return "Active";
  if (status === "paused") return "Paused";
  return "Under review";
}

export default function AdminDashboard() {
  const handleAction = (msg: string) => {
    // MVP only – just show a toast-style alert
    alert(msg);
  };

  return (
    <>
      <Head>
        <title>Management Admin Dashboard — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Management Admin</h1>
              <p className="mt-1 text-sm text-gray-400">
                High-level view of all sellers, performance and operations.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              Demo environment — controls are UI only
            </div>
          </div>

          {/* KPIs */}
          <section className="grid gap-4 md:grid-cols-3">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {k.label}
                </p>
                <p className="mt-2 text-xl font-semibold">{k.value}</p>
                {k.sub && (
                  <p className="mt-1 text-xs text-gray-500">
                    {k.sub}
                  </p>
                )}
              </div>
            ))}
          </section>

          {/* Sellers overview */}
          <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sellers overview</h2>
                <p className="text-xs text-gray-400">
                  Monitor performance per seller and jump into their workspace.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAction("Export would generate a CSV of all sellers.")
                  }
                  className="rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAction("In a full build this would open 'Create seller'.")
                  }
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Add seller
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-neutral-800 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Seller</th>
                    <th className="px-3 py-2 text-left">Active listings</th>
                    <th className="px-3 py-2 text-left">GMV (7d)</th>
                    <th className="px-3 py-2 text-left">Pending review</th>
                    <th className="px-3 py-2 text-left">Disputes</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-3 pr-3 align-top">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">
                          {s.email}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {s.activeListings}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {s.gmv7d}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {s.pendingReview || "—"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {s.disputes || "—"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs " +
                            (s.status === "active"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : s.status === "paused"
                              ? "bg-neutral-800 text-gray-300 border border-neutral-700"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/30")
                          }
                        >
                          {statusLabel(s.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(`Would open seller dashboard for ${s.name}.`)
                            }
                            className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs hover:border-neutral-500"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(`Would impersonate ${s.name} in seller console.`)
                            }
                            className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs hover:border-neutral-500"
                          >
                            Impersonate
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                s.status === "active"
                                  ? `Would pause new listings for ${s.name}.`
                                  : `Would reactivate ${s.name}.`
                              )
                            }
                            className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs text-amber-300 hover:border-amber-400"
                          >
                            {s.status === "active" ? "Pause" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Operations queue & health */}
          <section className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Items waiting for review
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• 9 new luxury bag listings</li>
                <li>• 4 high-value watches (&gt; $10,000)</li>
                <li>• 5 edits to existing listings</li>
              </ul>
              <button
                type="button"
                onClick={() =>
                  handleAction("Would send you to the review queue screen.")
                }
                className="mt-4 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
              >
                Open review queue
              </button>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <h3 className="mb-2 text-sm font-semibold">
                Platform health
              </h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Payouts to sellers: on-time (98%)</li>
                <li>• Chargebacks this month: 3 (0.4% of orders)</li>
                <li>• Average delivery rating: 4.8 / 5</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                In a full version, this panel would pull real-time metrics from
                Stripe, your courier partners and internal review tools.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

