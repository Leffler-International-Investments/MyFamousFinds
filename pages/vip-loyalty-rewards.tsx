// FILE: /pages/vip-loyalty-rewards.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipLoyaltyRewardsPage() {
  return (
    <>
      <Head>
        <title>Loyalty Rewards — Famous Finds VIP</title>
      </Head>

      <div className="min-h-screen bg-black text-gray-100 flex flex-col">
        <Header />

        <main className="flex-1 px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-3">
              VIP BENEFITS
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-yellow-400 mb-4">
              Earn Loyalty Rewards
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-8 max-w-2xl">
              Similar to Nike-style rewards programs, every purchase you make on
              Famous Finds earns points. Points unlock higher tiers, exclusive
              benefits, and special experiences.
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-2">How points work</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  • <span className="font-semibold">1 point</span> for every{" "}
                  <span className="font-semibold">$1 USD</span> you spend on
                  eligible items.
                </li>
                <li>• Bonus points on selected launches and VIP events.</li>
                <li>• Points are calculated on order completion (not pending).</li>
                <li>
                  • Your points never expire as long as you make at least one
                  purchase every 12 months.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-3">
                Tiers & thresholds
              </h2>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-1">
                    Tier 1
                  </p>
                  <p className="text-lg font-semibold mb-1">Member</p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">0 – 999</span> points
                  </p>
                  <p className="text-xs text-gray-400">
                    Base rewards & access to VIP events.
                  </p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-1">
                    Tier 2
                  </p>
                  <p className="text-lg font-semibold mb-1">Silver</p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">1,000 – 4,999</span> points
                  </p>
                  <p className="text-xs text-gray-400">
                    Early access windows and small birthday rewards.
                  </p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-1">
                    Tier 3
                  </p>
                  <p className="text-lg font-semibold mb-1">Gold</p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">5,000 – 14,999</span> points
                  </p>
                  <p className="text-xs text-gray-400">
                    Priority support, higher rewards, and occasional free
                    shipping.
                  </p>
                </div>
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-1">
                    Tier 4
                  </p>
                  <p className="text-lg font-semibold mb-1">Platinum</p>
                  <p className="text-gray-300 mb-1">
                    <span className="font-semibold">15,000+</span> points
                  </p>
                  <p className="text-xs text-gray-400">
                    Highest level access, invites to ultra-rare drops, and
                    concierge-style service.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-2">
                How we calculate rewards
              </h2>
              <p className="text-sm text-gray-300 mb-3">
                Behind the scenes, each completed order is written into the
                <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-800 text-xs">
                  orders
                </code>{" "}
                collection. A VIP engine updates your{" "}
                <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-800 text-xs">
                  vip_members
                </code>{" "}
                record:
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Add points based on the USD total.</li>
                <li>• Increase lifetime spend.</li>
                <li>• Recalculate tier based on the thresholds above.</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Later, this same engine can power dashboards inside the
                Management Admin area so you can audit points, manually adjust
                balances, or trigger bonus campaigns.
              </p>
            </section>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-gray-400 max-w-md">
                Make purchases, collect points automatically, and watch your
                tier upgrade — just like the best sneaker and sportswear
                programs.
              </p>
              <Link
                href="/vip-signup"
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-yellow-300"
              >
                Start earning points
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
