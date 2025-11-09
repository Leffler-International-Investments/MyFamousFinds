// FILE: /pages/index.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps, NextPage } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { adminDb } from "../utils/firebaseAdmin";

type ListingCard = {
  id: string;
  title: string;
  brand: string;
  priceLabel: string;
  image: string;
  href: string;
  badge?: string;
};

type HomeProps = {
  trending: ListingCard[];
  newArrivals: ListingCard[];
};

function formatPrice(amount: number, currency: string) {
  if (!amount || isNaN(amount)) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}

const Home: NextPage<HomeProps> = ({ trending, newArrivals }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Famous Finds — Curated Luxury Resale</title>
        <meta
          name="description"
          content="Curated, authenticated designer pieces — loved once and ready to be loved again."
        />
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-[0.18em] text-gray-400">
              WELCOME TO OUR WORLD OF LUXURY
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Famous Finds for every shade
              <br className="hidden sm:block" /> of style.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-300">
              Curated, authenticated designer pieces — loved once and ready to
              be loved again. A marketplace where every customer belongs, in all
              colours and all stories.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="#now-trending"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100"
              >
                Browse the catalogue
              </Link>
              <Link
                href="/seller/apply"
                className="inline-flex items-center rounded-full border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-900"
              >
                Apply to sell →
              </Link>
            </div>
          </div>

          {/* Right hero card */}
          <aside className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              Your personal style butler
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Meet your Famous Finds AI Butler.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-gray-300">
              Tell us what you&apos;re looking for — a Chanel bag, a Rolex, or a
              special dress — and your Butler will search only within Famous
              Finds.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/ai-butler"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
              >
                AI Butler
              </Link>
              <Link
                href="#now-trending"
                className="inline-flex items-center rounded-full border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-900"
              >
                Browse the catalogue
              </Link>
            </div>
          </aside>
        </section>

        {/* CATEGORY NAV */}
        <section className="mt-10 border-t border-white/5 pt-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-300">
            <Link href="/search?category=Bags" className="hover:text-white">
              Bags
            </Link>
            <Link href="/search?category=Watches" className="hover:text-white">
              Watches
            </Link>
            <Link href="/search?category=Kids" className="hover:text-white">
              Kids
            </Link>
            <Link href="/search?category=Clothing" className="hover:text-white">
              Clothing
            </Link>
            <Link href="/search?category=Jewelry" className="hover:text-white">
              Jewelry
            </Link>
            <Link href="/search?category=Home" className="hover:text-white">
              Home
            </Link>
            <Link href="/search?category=Shoes" className="hover:text-white">
              Shoes
            </Link>
            <Link href="/search?category=Men" className="hover:text-white">
              Men
            </Link>
            <Link href="/search?category=Beauty" className="hover:text-white">
              Beauty
            </Link>
            <Link href="/search?category=Accessories" className="hover:text-white">
              Accessories
            </Link>
            <Link href="/search?category=Women" className="hover:text-white">
              Women
            </Link>
            <Link href="/search?category=Sale" className="hover:text-white">
              Sale
            </Link>
          </nav>
        </section>

        {/* NOW TRENDING */}
        <section id="now-trending" className="mt-10 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-[0.16em] text-gray-400">
                NOW TRENDING
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Live listings currently available on Famous Finds.
              </p>
            </div>
            <Link
              href="/search?sort=trending"
              className="text-xs font-semibold text-gray-300 hover:text-white"
            >
              View all →
            </Link>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {item.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {item.brand}
                    </p>
                    <h3 className="text-sm font-medium text-white">
                      <Link href={item.href} className="hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.priceLabel}</p>
                    <Link
                      href={item.href}
                      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300 hover:text-white"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {trending.length === 0 && (
              <p className="text-xs text-gray-400">
                No live listings yet. Once items are approved and set to{" "}
                <strong>Live</strong>, they will automatically appear here.
              </p>
            )}
          </div>
        </section>

        {/* NEW ARRIVALS */}
        <section className="mt-12 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-[0.16em] text-gray-400">
                NEW ARRIVALS
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Fresh listings recently approved by the Famous Finds team.
              </p>
            </div>
            <Link
              href="/search?sort=new"
              className="text-xs font-semibold text-gray-300 hover:text-white"
            >
              View all →
            </Link>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newArrivals.map((item) => (
              <article
                key={`${item.id}-new`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {item.brand}
                    </p>
                    <h3 className="text-sm font-medium text-white">
                      <Link href={item.href} className="hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.priceLabel}</p>
                    <Link
                      href={item.href}
                      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300 hover:text-white"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {newArrivals.length === 0 && (
              <p className="text-xs text-gray-400">
                No recent arrivals yet. As new items are approved they&apos;ll
                appear here automatically.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    // Only show listings that are actually LIVE on the marketplace
    const snap = await adminDb
      .collection("listings")
      .where("status", "==", "Live") // ← IMPORTANT: use Live, not Active
      .orderBy("createdAt", "desc")
      .limit(24)
      .get();

    const listings: ListingCard[] = snap.docs.map((doc) => {
      const data = doc.data() || {};
      const rawPrice =
        typeof data.price === "number"
          ? data.price
          : Number(data.price || 0) || 0;

      return {
        id: doc.id,
        title: String(data.title || "Untitled item"),
        brand: data.brand ? String(data.brand) : "Independent seller",
        priceLabel: formatPrice(rawPrice, data.currency || "USD"),
        image:
          (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
          data.imageUrl ||
          "/hero-sneaker.jpg",
        href: `/product/${doc.id}`,
        badge: data.badge ? String(data.badge) : undefined,
      };
    });

    const trending = listings.slice(0, 8);
    const newArrivals = listings.slice(8, 16);

    return {
      props: {
        trending,
        newArrivals,
      },
    };
  } catch (err) {
    console.error("home_page_error", err);
    return {
      props: {
        trending: [],
        newArrivals: [],
      },
    };
  }
};

export default Home;
