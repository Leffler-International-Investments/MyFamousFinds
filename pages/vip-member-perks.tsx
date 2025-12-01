// FILE: /pages/vip-member-perks.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipMemberPerksPage() {
  return (
    <>
      <Head>
        <title>Member-Only Perks — Famous Finds VIP</title>
      </Head>

      <div className="min-h-screen bg-black text-gray-100 flex flex-col">
        <Header />

        <main className="flex-1 px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-3">
              VIP BENEFITS
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-yellow-400 mb-4">
              Member-Only Perks
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-8 max-w-2xl">
              Beyond points and access, VIP members receive practical perks that
              make every purchase smoother — modelled on how Nike-style
              memberships reward ongoing loyalty.
            </p>

            <div className="space-y-6 mb-10">
              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Complimentary & discounted shipping
                </h2>
                <p className="text-sm text-gray-300">
                  VIP members receive occasional free shipping promotions and
                  tier-based discounted shipping rates on eligible orders.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Saved carts & wishlists
                </h2>
                <p className="text-sm text-gray-300">
                  Stay signed in on your devices and keep track of pieces you
                  love. When something you saved goes on promotion, you&apos;ll
                  be the first to know.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  VIP service & support
                </h2>
                <p className="text-sm text-gray-300">
                  High-tier members get faster support routing and priority
                  handling on authentication questions, returns, and delivery
                  problems.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Birthday & anniversary rewards
                </h2>
                <p className="text-sm text-gray-300">
                  Add your key dates to your VIP profile to receive special
                  offers or bonus points during your celebration month.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-gray-400 max-w-md">
                The more you engage with Famous Finds, the smarter your benefits
                become — personalised offers, tailored drops, and private
                events.
              </p>
              <Link
                href="/vip-signup"
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-yellow-300"
              >
                Unlock your perks
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
