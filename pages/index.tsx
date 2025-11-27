// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import HomepageButler from "../components/HomepageButler";
import { adminDb } from "../utils/firebaseAdmin";

// ----------------- Types -----------------

type ListingCard = {
  id: string;
  title: string;
  price: string;
  primaryImageUrl?: string | null;
  designer?: string | null;
};

type DesignerCard = {
  id: string;
  name: string;
  slug: string;
};

type HomeProps = {
  trending: ListingCard[];
  newArrivals: ListingCard[];
  designers: DesignerCard[];
};

// ----------------- Small components -----------------

const HomeProductGrid: React.FC<{ items: ListingCard[] }> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        More pieces will appear here soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <article
          key={item.id}
          className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden flex flex-col"
        >
          <div className="relative w-full aspect-[4/5] bg-neutral-50">
            {/* Fallback placeholder image if none provided */}
            <img
              src={item.primaryImageUrl || "/ff-placeholder.png"}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex flex-col gap-1">
            {item.designer && (
              <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-500">
                {item.designer}
              </p>
            )}
            <h3 className="text-sm font-medium text-neutral-900 line-clamp-2">
              {item.title}
            </h3>
            {item.price && (
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {item.price}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

const FeaturedDesignersCarousel: React.FC<{ designers: DesignerCard[] }> = ({
  designers,
}) => {
  if (!designers || designers.length === 0) return null;

  return (
    <section className="mt-16 mb-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-wide">
          Featured Designers
        </h2>
        <Link
          href="/designers"
          className="text-xs text-neutral-500 hover:text-neutral-800 underline-offset-4 hover:underline"
        >
          View full directory
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {designers.map((d) => {
          const label = d.name;
          const slug = d.slug || d.name.toLowerCase().replace(/\s+/g, "-");

          return (
            <Link
              key={d.id}
              href={`/products?designer=${encodeURIComponent(slug)}`}
              className="whitespace-nowrap px-4 py-2 rounded-full border border-neutral-200 bg-white text-sm hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

// ----------------- Page component -----------------

const Home: NextPage<HomeProps> = ({ trending, newArrivals, designers }) => {
  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="wrap">
        {/* HERO + SNAPSHOT ROW */}
        <div className="home-hero-layout">
          {/* LEFT: HERO COPY */}
          <section className="home-hero">
            <p className="home-eyebrow">• Curated pre-loved luxury</p>
            <h1 className="home-title">
              Discover, save &amp; shop
              <br />
              authenticated designer pieces.
            </h1>
            <p className="home-subtitle">
              Browse a hand-picked selection of bags, jewelry, watches and
              ready-to-wear from trusted sellers. Every piece is vetted so you
              can shop with confidence.
            </p>

            {/* STATS ROW */}
            <div className="home-stats-row">
              <article className="home-stat-card">
                <h3 className="home-stat-label">Live listings</h3>
                <p className="home-stat-value">20+</p>
                <p className="home-stat-caption">Updated in real time</p>
              </article>

              <article className="home-stat-card">
                <h3 className="home-stat-label">New this week</h3>
                <p className="home-stat-value">10+</p>
                <p className="home-stat-caption">Fresh drops &amp; finds</p>
              </article>

              <article className="home-stat-card">
                <h3 className="home-stat-label">Designers</h3>
                <p className="home-stat-value">50+</p>
                <p className="home-stat-caption">From Chanel to Rolex</p>
              </article>

              <article className="home-stat-card">
                <h3 className="home-stat-label">Authentication</h3>
                <p className="home-stat-value">100%</p>
                <p className="home-stat-caption">Every piece reviewed</p>
              </article>
            </div>

            {/* CTA ROW */}
            <div className="home-cta-row">
              <a href="/new-arrivals" className="btn-primary">
                Browse New Arrivals
              </a>
              <a href="/trending" className="btn-secondary">
                View Trending Pieces
              </a>
              <a href="/designers" className="btn-tertiary">
                Shop by Designer
              </a>
            </div>
          </section>

          {/* RIGHT: SNAPSHOT PANEL */}
          <section className="home-snapshot">
            <header className="snapshot-header">
              <div>
                <p className="snapshot-title">Your Famous Finds Snapshot</p>
                <p className="snapshot-subtitle">Guest view</p>
              </div>
            </header>

            <dl className="snapshot-metrics">
              <div className="snapshot-row">
                <dt>Saved Items</dt>
                <dd>0</dd>
              </div>
              <div className="snapshot-row">
                <dt>Recently Viewed</dt>
                <dd>0</dd>
              </div>
              <div className="snapshot-row">
                <dt>Active Offers</dt>
                <dd>0</dd>
              </div>
            </dl>

            <div className="snapshot-actions">
              <a href="/dashboard" className="btn-primary block">
                Sign in to view your dashboard
              </a>
              <a href="/signup" className="btn-outline block">
                Create a free buyer account
              </a>
            </div>
          </section>
        </div>

        {/* FEATURED DESIGNERS CAROUSEL */}
        <FeaturedDesignersCarousel designers={designers} />

        {/* NEW ARRIVALS + TRENDING ROW */}
        <div className="home-feed-layout">
          <section className="home-feed-section">
            <header className="home-feed-header">
              <h2 className="home-feed-title">New Arrivals</h2>
              <p className="home-feed-subtitle">
                Just in – freshly listed pieces from our vetted sellers.
              </p>
            </header>

            <HomeProductGrid items={newArrivals} />
          </section>

          <section className="home-feed-section">
            <header className="home-feed-header">
              <h2 className="home-feed-title">Trending Now</h2>
              <p className="home-feed-subtitle">
                Most-viewed and most-saved listings this week.
              </p>
            </header>

            <HomeProductGrid items={trending} />
          </section>
        </div>

        {/* STORY / TRUST STRIP */}
        <div className="home-trust-row">
          <section className="home-trust-card">
            <h3>Every piece has a story.</h3>
            <p>
              From vintage runway to modern icons, each item is authenticated
              and ready for a second life in your wardrobe.
            </p>
          </section>
          <section className="home-trust-card">
            <h3>For collectors &amp; first-timers.</h3>
            <p>
              Simple tools for sellers, transparent history for buyers, and a
              modern marketplace feel tailored to you.
            </p>
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

// ----------------- Data fetching -----------------

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  let trending: ListingCard[] = [];
  let newArrivals: ListingCard[] = [];
  let designers: DesignerCard[] = [];

  try {
    // LIVE LISTINGS
    const liveSnap = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .limit(40)
      .get();

    const allLive: ListingCard[] = liveSnap.docs.map((doc) => {
      const data = doc.data() as any;
      const rawPrice = data.price;
      let displayPrice = "";

      if (typeof rawPrice === "number") {
        displayPrice = `$${rawPrice.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
      } else if (typeof rawPrice === "string") {
        displayPrice = rawPrice;
      }

      return {
        id: doc.id,
        title: data.title || data.name || "Untitled piece",
        price: displayPrice,
        primaryImageUrl:
          data.primaryImageUrl || data.imageUrl || data.image || null,
        designer: data.designer || data.brand || null,
      };
    });

    // New Arrivals = latest items
    newArrivals = allLive.slice(0, 8);
    // Trending = next group
    trending = allLive.slice(8, 16);

    // DESIGNERS for carousel – all active designers
    const designersSnap = await adminDb
      .collection("designers")
      .where("active", "==", true)
      .get();

    designers = designersSnap.docs
      .map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || "",
          slug:
            data.slug ||
            (data.name
              ? String(data.name).toLowerCase().replace(/\s+/g, "-")
              : ""),
        };
      })
      .filter((d) => d.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error loading homepage data:", error);
  }

  return {
    props: {
      trending,
      newArrivals,
      designers,
    },
  };
};

export default Home;
