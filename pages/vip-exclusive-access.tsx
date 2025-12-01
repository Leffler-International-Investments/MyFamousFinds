// FILE: /pages/vip-exclusive-access.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipExclusiveAccessPage() {
  return (
    <>
      <Head>
        <title>VIP Exclusive Access — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-black text-gray-100 flex flex-col">
        <Header />

        <main className="flex-1 px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-3">
              VIP BENEFITS
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-yellow-400 mb-4">
              Exclusive Access
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-8 max-w-2xl">
              Inspired by leading programs like Nike Membership, your Famous
              Finds VIP status unlocks private drops, early access windows, and
              invite-only experiences around our most sought-after pieces.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Early access windows
                </h2>
                <p className="text-sm text-gray-300">
                  VIP members see selected drops up to{" "}
                  <span className="font-semibold text-yellow-300">48 hours</span>{" "}
                  before the public. The more you spend in a season, the longer
                  your early access window becomes.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Invite-only previews
                </h2>
                <p className="text-sm text-gray-300">
                  High-tier members receive digital lookbooks and curated
                  previews for celebrity, archive, and one-of-one drops — just
                  like a private showroom appointment.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Reserved sizes & pieces
                </h2>
                <p className="text-sm text-gray-300">
                  For selected launches, we ring-fence inventory for VIP
                  members, reducing the “sold-out in seconds” frustration.
                </p>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Priority notifications
                </h2>
                <p className="text-sm text-gray-300">
                  Turn on VIP alerts to be first in line when a designer or
                  category you love goes live.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-gray-400 max-w-md">
                As your tier increases, your access level upgrades — from early
                emails at Member level to guaranteed access windows at Platinum.
              </p>
              <Link
                href="/vip-signup"
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-yellow-300"
              >
                Join the Club
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
