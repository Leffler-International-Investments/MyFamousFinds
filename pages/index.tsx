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

const Home: NextPage<HomeProps> = ({
  trending = [],
  newArrivals = [],
}) => {
  const totalItems = (trending.length || 0) + (newArrivals.length || 0);

  return (
    <div className="page-wrapper bg-white">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="page-content">
        <div className="wrap space-y-10">
          {/* HERO */}
          <section className="home-hero rounded-3xl bg-white border border-slate-200 px-6 py-7 md:px-10 md:py-9 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center">
              {/* Left: copy */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-slate-600 border border-slate-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
                  Curated pre-loved luxury
                </div>

                <h1 className="hero-main-title leading-tight text-slate-900">
                  Find the{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                    one-of-a-kind
                  </span>{" "}
                  pieces everyone else missed.
                </h1>

                <p className="hero-tagline max-w-xl text-sm md:text-base text-slate-600">
                  Hand-picked designer fashion, authenticated and ready to
                  re-wear. New treasures dropping, iconic pieces trending — all
                  in one place.
                </p>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700 border border-slate-200">
                    <span className="number-badge bg-emerald-500 text-white">
                      {totalItems || "20+"}
                    </span>
                    <span>
                      Live listings •{" "}
                      <span className="font-semibold">
                        Trending &amp; fresh drops
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700 border border-slate-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300">
                      ✅
                    </span>
                    <span>Every piece authenticated by experts</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700 border border-slate-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-300">
                      ✨
                    </span>
                    <span>VIP-style resale experience</span>
                  </div>
                </div>

                {/* CTAs */}
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
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    View fresh arrivals
                  </a>
                </div>
              </div>

              {/* Right: animated panel */}
              <div className="hidden md:block">
                <div className="relative h-full">
                  <HomepageButler />
                </div>
              </div>
            </div>
          </section>

          {/* TRENDING SECTION */}
          <section id="trending" className="section">
            <div className="section-header">
              <h2>Trending right now</h2>
              <p className="section-subtitle">
                Most-loved pieces shoppers are viewing and saving today.
              </p>
            </div>

            <DemoGrid items={trending} />
          </section>

          {/* NEW ARRIVALS SECTION */}
          <section id="new-arrivals" className="section">
            <div className="section-header">
              <h2>Fresh arrivals</h2>
              <p className="section-subtitle">
                Just in — new drops from our vetted sellers.
              </p>
            </div>

            <DemoGrid items={newArrivals} />
          </section>

          {/* HOW IT WORKS / VALUE PROP SECTION */}
          <section className="section">
            <div className="section-header">
              <h2>Why shop Famous Finds?</h2>
              <p className="section-subtitle">
                A smoother, safer way to buy and sell pre-loved luxury.
              </p>
            </div>

            <div className="info-grid">
              <article className="info-card">
                <h3>Authenticity first</h3>
                <p>
                  Every item is reviewed and checked against brand-specific
                  criteria, so you can shop with confidence.
                </p>
              </article>

              <article className="info-card">
                <h3>Curated selection</h3>
                <p>
                  We focus on quality, condition and desirability – the
                  pieces that genuinely deserve another life.
                </p>
              </article>

              <article className="info-card">
                <h3>Smoother resale</h3>
                <p>
                  Simple tools for sellers, clear information for buyers, and a
                  modern marketplace feel.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>

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
