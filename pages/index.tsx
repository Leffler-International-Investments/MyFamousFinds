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
        <div className="wrap space-y-16 md:space-y-24">
          {/* LUXURY HERO SECTION */}
          <section className="home-hero relative overflow-hidden rounded-[32px] bg-[#F9F9F7] px-6 py-12 md:px-12 md:py-20 text-center">
            <div className="mx-auto max-w-4xl space-y-8">
              
              {/* Top Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Curated Pre-loved Luxury
                </div>
              </div>

              {/* Headline */}
              <h1 className="hero-main-title font-serif text-4xl md:text-6xl leading-[1.1] text-neutral-900 tracking-tight">
                Find the{" "}
                <span className="italic text-neutral-600">one-of-a-kind</span>{" "}
                pieces everyone else missed.
              </h1>

              {/* Subheadline */}
              <p className="mx-auto max-w-2xl text-base md:text-lg text-neutral-500 leading-relaxed font-light">
                Hand-picked designer fashion, authenticated and ready to re-wear.
                New treasures dropping, iconic pieces trending — all in one place.
              </p>

              {/* CTAs */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                <a
                  href="#trending"
                  className="global-cta-button min-w-[200px] bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-lg transition-all duration-300"
                >
                  Start with Trending
                </a>

                <a
                  href="#new-arrivals"
                  className="min-w-[200px] inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white hover:border-neutral-400 transition-all"
                >
                  View Fresh Arrivals
                </a>
              </div>

              {/* Trust Indicators / Stats - Minimalist Row */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-8 text-xs md:text-sm font-medium text-neutral-400 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">●</span> {totalItems || "20+"} Live Listings
                </div>
                <div className="hidden md:block w-px h-3 bg-neutral-300"></div>
                <div className="flex items-center gap-2">
                  <span>✓</span> 100% Authenticated
                </div>
                <div className="hidden md:block w-px h-3 bg-neutral-300"></div>
                <div className="flex items-center gap-2">
                  <span>★</span> VIP Experience
                </div>
              </div>
            </div>
            
            {/* --- OLD BUTLER BLOCK REMOVED FROM HERE --- */}
          </section>

          {/* TRENDING SECTION */}
          <section id="trending" className="section">
            <div className="section-header flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mb-2">Trending Now</h2>
                <p className="section-subtitle text-neutral-500 text-sm uppercase tracking-wide">
                  Most-loved pieces shoppers are saving today
                </p>
              </div>
              <div className="h-px flex-1 bg-neutral-100 mx-8 hidden md:block"></div>
            </div>

            <DemoGrid items={trending} />
          </section>

          {/* NEW ARRIVALS SECTION */}
          <section id="new-arrivals" className="section">
            <div className="section-header flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mb-2">Fresh Arrivals</h2>
                <p className="section-subtitle text-neutral-500 text-sm uppercase tracking-wide">
                  Just In — New Drops From Vetted Sellers
                </p>
              </div>
               <div className="h-px flex-1 bg-neutral-100 mx-8 hidden md:block"></div>
            </div>

            <DemoGrid items={newArrivals} />
          </section>

          {/* WHY SHOP - 3 Column Grid */}
          <section className="section py-12 border-t border-neutral-100">
             <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mb-3">Why Famous Finds?</h2>
                <p className="text-neutral-500">The premier destination for secure luxury resale.</p>
             </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 px-4 md:px-0">
              <article className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 text-xl">
                  🛡️
                </div>
                <h3 className="font-serif text-xl text-neutral-900">Authenticity First</h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  Every item is reviewed and checked against brand-specific
                  criteria, so you can shop with absolute confidence.
                </p>
              </article>

              <article className="text-center space-y-3">
                 <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 text-xl">
                  💎
                </div>
                <h3 className="font-serif text-xl text-neutral-900">Curated Selection</h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  We focus on quality, condition and desirability – only the
                  pieces that genuinely deserve another life.
                </p>
              </article>

              <article className="text-center space-y-3">
                 <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-neutral-100 text-xl">
                  ✨
                </div>
                <h3 className="font-serif text-xl text-neutral-900">Seamless Experience</h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  Simple tools for sellers, transparent history for buyers, and a modern marketplace feel tailored to you.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>

      {/* GLOBAL FLOATING BUTLER — Always bottom-right */}
      <div className="butler-floating">
        <HomepageButler />
      </div>

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
