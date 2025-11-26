// FILE: /pages/index.tsx

import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";
import type { ComponentType } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import HomepageButler from "../components/HomepageButler";

// Cast DemoGrid so TypeScript stops complaining about props
const TypedDemoGrid = DemoGrid as ComponentType<any>;

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

const Home: NextPage<HomeProps> = ({ trending, newArrivals }) => {
  const totalItems = (trending?.length || 0) + (newArrivals?.length || 0);

  return (
    <div className="page-wrapper bg-white">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="page-content">
        {/* MAIN CONTENT WRAPPER */}
        <div className="wrap space-y-10">
          {/* HERO SECTION */}
          <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black text-slate-50 px-6 py-7 md:px-10 md:py-9 shadow-xl">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center">
              {/* Left side: text */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-slate-300 border border-slate-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
                  Curated pre-loved luxury
                </div>

                <h1 className="hero-main-title text-slate-50 leading-tight">
                  Find the{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                    one-of-a-kind
                  </span>{" "}
                  pieces everyone else missed.
                </h1>

                <p className="hero-tagline max-w-xl text-sm md:text-base text-slate-300">
                  Hand-picked designer fashion, authenticated and ready to
                  re-wear. New treasures dropping, iconic pieces trending —
                  all in one place.
                </p>

                {/* Quick stats / chips */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 text-xs text-slate-200 border border-slate-700">
                    <span className="number-badge bg-emerald-400 text-slate-900">
                      {totalItems || "20+"}
                    </span>
                    <span>
                      Live listings •{" "}
                      <span className="font-semibold">
                        Trending &amp; fresh drops
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill bg-slate-800/70 text-xs text-slate-200 border border-slate-700">
                      Bags &amp; Accessories
                    </span>
                    <span className="pill bg-slate-800/70 text-xs text-slate-200 border border-slate-700">
                      Ready-to-wear
                    </span>
                    <span className="pill bg-slate-800/70 text-xs text-slate-200 border border-slate-700">
                      Collectible pieces
                    </span>
                  </div>
                </div>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#trending"
                    className="global-cta-button bg-amber-300 text-slate-900 hover:brightness-105 shadow-md"
                  >
                    Start with trending
                    <span>↗</span>
                  </a>

                  <a
                    href="#new-arrivals"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900/70 transition-colors"
                  >
                    View fresh arrivals
                  </a>
                </div>
              </div>

              {/* Right side: small animated panel */}
              <div className="hidden md:block">
                <div className="relative h-full">
                  <div className="absolute inset-0 rounded-3xl bg-slate-950/40 blur-3xl" />
                  <div className="relative rounded-3xl border border-slate-700/70 bg-slate-900/80 px-4 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-slate-300">
                          Today&apos;s edit
                        </p>
                        <p className="text-sm font-semibold text-slate-50">
                          Curated by Famous Finds
                        </p>
                      </div>
                      <span className="ai-helper-pill-avatar text-xs">
                        FF
                      </span>
                    </div>

                    <div className="space-y-3 text-xs text-slate-200">
                      <div className="flex items-center justify-between">
                        <span>Iconic statement pieces</span>
                        <span className="status-pill live text-[10px] px-2 py-1">
                          Live now
                        </span>
                      </div>
                      <div className="progress-row">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-inner"
                            style={{ width: "78%" }}
                          />
                        </div>
                        <span className="progress-label text-[11px]">
                          78% curated
                        </span>
                      </div>
                      <ul className="ai-checklist text-[11px]">
                        <li>
                          <span className="ai-checklist-icon">✔</span>
                          <span>Authenticated luxury, ready to ship</span>
                        </li>
                        <li>
                          <span className="ai-checklist-icon">★</span>
                          <span>Only the best condition pieces</span>
                        </li>
                        <li>
                          <span className="ai-checklist-icon">➜</span>
                          <span>New edits landing weekly</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Scroll to explore collections ↓</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRENDING SECTION */}
          <section id="trending" className="space-y-3">
            <div className="section-header">
              <h2 className="text-base md:text-lg font-semibold tracking-wide">
                Trending right now
              </h2>
              <p className="text-xs md:text-sm text-muted">
                Pieces with high demand and low supply — they won&apos;t stay
                here for long.
              </p>
            </div>

            <TypedDemoGrid products={trending} variant="trending" />

            <div className="stat-line mt-1">
              <span className="stat-pill">
                🔥 Most viewed in the last 24h
              </span>
              <span className="note-text">
                Tap into any item to see photos, details, and condition.
              </span>
            </div>
          </section>

          {/* NEW ARRIVALS SECTION */}
          <section id="new-arrivals" className="space-y-3">
            <div className="section-header">
              <h2 className="text-base md:text-lg font-semibold tracking-wide">
                Fresh arrivals
              </h2>
              <p className="text-xs md:text-sm text-muted">
                Newly added pieces from trusted sellers — discover them before
                everyone else.
              </p>
            </div>

            <TypedDemoGrid products={newArrivals} variant="new" />

            <div className="stat-line mt-1">
              <span className="stat-pill">✨ Recently added</span>
              <span className="note-text">
                Check back often — drops are continuous and highly curated.
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* SINGLE Butler — no duplicates */}
      <HomepageButler />

      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  let trending: ProductLike[] = [];
  let newArrivals: ProductLike[] = [];

  try {
    // Trending products (flag-based)
    const trendingSnap = await adminDb
      .collection("products")
      .where("isTrending", "==", true)
      .limit(8)
      .get();

    trending = trendingSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ProductLike, "id">),
    }));

    // New arrivals (by createdAt desc)
    const newArrivalsSnap = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();

    newArrivals = newArrivalsSnap.docs.map((doc) => ({
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
