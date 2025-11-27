// FILE: /pages/index.tsx

import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import HomepageButler from "../components/HomepageButler";

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

const Home: NextPage<HomeProps> = ({ trending = [], newArrivals = [] }) => {
  const totalItems = (trending.length || 0) + (newArrivals.length || 0);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Head>
        <title>Famous Finds – Curated Luxury Resale</title>
      </Head>

      {/* DO NOT TOUCH – shared header */}
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-0 py-10 md:py-14 space-y-12 md:space-y-16">
          {/* TOP HERO – closer to shopfamousfinds.store feel */}
          <section className="grid gap-10 md:grid-cols-[1.4fr,1fr] items-start">
            {/* Left side: welcome + actions */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#F9F9F7] px-4 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Curated Pre-Loved Luxury
              </div>

              <div className="space-y-3">
                <h1 className="font-serif text-3xl md:text-[40px] leading-tight tracking-tight text-neutral-900">
                  Discover, save & shop
                  <br />
                  authenticated designer pieces.
                </h1>
                <p className="text-sm md:text-base text-neutral-500 max-w-xl">
                  Browse a hand-picked selection of bags, jewelry, watches and
                  ready-to-wear from trusted sellers. Every piece is vetted so
                  you can shop with confidence.
                </p>
              </div>

              {/* Quick stats similar to dashboard cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                    Live Listings
                  </p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">
                    {totalItems || "20+"}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Updated in real time
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                    New This Week
                  </p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">
                    {newArrivals.length || "10+"}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Fresh drops & finds
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                    Designers
                  </p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">
                    50+
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    From Chanel to Rolex
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                    Authentication
                  </p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">
                    100%
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Every piece reviewed
                  </p>
                </div>
              </div>

              {/* CTA row – mimics the “Quick actions” feel */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#new-arrivals"
                  className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition"
                >
                  Browse New Arrivals
                </a>
                <a
                  href="#trending"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:border-neutral-500 transition"
                >
                  View Trending Pieces
                </a>
                <a
                  href="/designers"
                  className="inline-flex items-center justify-center rounded-full border border-dashed border-neutral-300 px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 hover:border-neutral-500 hover:text-neutral-900 transition"
                >
                  Shop by Designer
                </a>
              </div>
            </div>

            {/* Right side: simple “account style” summary card */}
            <aside className="rounded-2xl border border-neutral-200 bg-white px-6 py-6 md:px-7 md:py-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Your Famous Finds Snapshot
                </h2>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                  Guest view
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Saved Items</span>
                  <span className="font-semibold text-neutral-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Recently Viewed</span>
                  <span className="font-semibold text-neutral-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Active Offers</span>
                  <span className="font-semibold text-neutral-900">0</span>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <button className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition">
                  Sign in to view your dashboard
                </button>
                <button className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:border-neutral-500 transition">
                  Create a free buyer account
                </button>
              </div>
            </aside>
          </section>

          {/* CATEGORY SHORTCUTS – horizontal pills like nav bar */}
          <section className="border-t border-neutral-100 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-xl md:text-2xl text-neutral-900">
                Shop by Category
              </h2>
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <a
                  href="/category/women"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition"
                >
                  Women
                </a>
                <a
                  href="/category/bags"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition"
                >
                  Bags
                </a>
                <a
                  href="/category/jewelry"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition"
                >
                  Jewelry
                </a>
                <a
                  href="/category/watches"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition"
                >
                  Watches
                </a>
                <a
                  href="/designers"
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition"
                >
                  All Designers
                </a>
              </div>
            </div>
          </section>

          {/* NEW ARRIVALS – main grid like “All Products” */}
          <section id="new-arrivals" className="space-y-4 pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-neutral-900">
                  New Arrivals
                </h2>
                <p className="text-xs md:text-sm text-neutral-500">
                  Just in – freshly listed pieces from our vetted sellers.
                </p>
              </div>
            </div>

            <DemoGrid items={newArrivals} />
          </section>

          {/* TRENDING – second grid */}
          <section id="trending" className="space-y-4 pt-4 pb-6">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-neutral-900">
                  Trending Now
                </h2>
                <p className="text-xs md:text-sm text-neutral-500">
                  Most-viewed and most-saved listings this week.
                </p>
              </div>
            </div>

            <DemoGrid items={trending} />
          </section>
        </div>
      </main>

      {/* Floating Butler – unchanged */}
      <div className="fixed bottom-6 right-4 md:right-8 z-40">
        <HomepageButler />
      </div>

      {/* DO NOT TOUCH – shared footer */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  let trending: ProductLike[] = [];
  let newArrivals: ProductLike[] = [];

  try {
    const trendingSnap = await adminDb
      .collection("products")
      .where("isTrending", "==", true)
      .limit(12)
      .get();
    trending = trendingSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ProductLike, "id">),
    }));

    const arrivalsSnap = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();
    newArrivals = arrivalsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ProductLike, "id">),
    }));
  } catch (error) {
    console.error("Error loading homepage products:", error);
  }

  return {
    props: {
      trending,
      newArrivals,
    },
  };
};

export default Home;
