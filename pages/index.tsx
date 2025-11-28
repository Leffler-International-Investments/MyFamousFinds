// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { GetServerSideProps } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";

type IndexPageProps = {
  liveCount: number;
  designersCount: number;
  activeOffersCount: number;
  newThisWeekCount: number;
  latestListings: ProductLike[];
  trendingListings: ProductLike[];
};

export const getServerSideProps: GetServerSideProps<IndexPageProps> = async () => {
  try {
    const listingsRef = adminDb.collection("listings");

    const snapshot = await listingsRef.get();
    const allListings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      } as any;
    });

    const liveListings = allListings.filter((l) => l.status === "live");
    const liveCount = liveListings.length;

    const designersSet = new Set<string>();
    let activeOffersCount = 0;

    liveListings.forEach((listing) => {
      if (listing.designer) {
        designersSet.add(listing.designer);
      }
      if (Array.isArray(listing.offers)) {
        activeOffersCount += listing.offers.filter(
          (offer: any) => offer.status === "pending" || offer.status === "accepted"
        ).length;
      }
    });

    const designersCount = designersSet.size;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = liveListings.filter((listing) => {
      if (!listing.createdAt) return false;
      const createdDate = new Date(listing.createdAt);
      return createdDate >= oneWeekAgo;
    });
    const newThisWeekCount = newThisWeek.length;

    const latestListings = liveListings
      .slice()
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    const trendingListings = liveListings
      .slice()
      .sort((a, b) => {
        const offersA = Array.isArray(a.offers)
          ? a.offers.filter((o: any) => o.status === "pending" || o.status === "accepted").length
          : 0;
        const offersB = Array.isArray(b.offers)
          ? b.offers.filter((o: any) => o.status === "pending" || o.status === "accepted").length
          : 0;
        return offersB - offersA;
      })
      .slice(0, 6);

    return {
      props: {
        liveCount,
        designersCount,
        activeOffersCount,
        newThisWeekCount,
        latestListings,
        trendingListings,
      },
    };
  } catch (error) {
    console.error("Error loading home page stats:", error);
    return {
      props: {
        liveCount: 0,
        designersCount: 0,
        activeOffersCount: 0,
        newThisWeekCount: 0,
        latestListings: [],
        trendingListings: [],
      },
    };
  }
};

export default function IndexPage({
  liveCount,
  designersCount,
  activeOffersCount,
  newThisWeekCount,
  latestListings,
  trendingListings,
}: IndexPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      await router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    } finally {
      setSearching(false);
    }
  };

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <>
      <Head>
        <title>Famous Finds — Shop authenticated designer pieces</title>
        <meta
          name="description"
          content="Discover curated, authenticated pre-loved designer bags, jewelry, watches and ready-to-wear from trusted sellers. Every piece is vetted so you can buy with confidence."
        />
        {/* Google Search Console */}
        <meta
          name="google-site-verification"
          content="RQh6GnJJ4BngX_4si1xGlYpnL9_7Z5srwkz1P3YSrhk"
        />
        {/* Bing Webmaster Tools */}
        <meta
          name="msvalidate.01"
          content="1A5F9E495867B41926D6E2C113347122"
        />
      </Head>

      <Header />

      <main className="page">
        <div className="page-inner">
          {/* HERO */}
          <section className="hero">
            <div className="hero-content">
              <div className="hero-copy">
                <p className="hero-kicker">Curated pre-loved luxury</p>
                <h1 className="hero-title">
                  Discover, save &amp; shop authenticated designer pieces.
                </h1>
                <p className="hero-subtitle">
                  Browse a hand-picked selection of bags, jewelry, watches and ready-to-wear
                  from trusted sellers. Every piece is reviewed so you can shop with confidence.
                </p>

                <div className="hero-ctas">
                  <Link href="/category/new-arrivals" className="btn-primary">
                    Browse New Arrivals
                  </Link>
                  <Link href="/sell" className="btn-secondary">
                    Apply to Sell
                  </Link>
                </div>

                <div className="hero-metrics">
                  <div className="hero-metric">
                    <span className="metric-label">Live listings</span>
                    <span className="metric-value">{formatCompact(liveCount)}</span>
                    <span className="metric-caption">All authenticated &amp; vetted</span>
                  </div>
                  <div className="hero-metric">
                    <span className="metric-label">Designers</span>
                    <span className="metric-value">{formatCompact(designersCount)}</span>
                    <span className="metric-caption">Chanel, Hermès, Rolex &amp; more</span>
                  </div>
                  <div className="hero-metric">
                    <span className="metric-label">Active offers</span>
                    <span className="metric-value">{formatCompact(activeOffersCount)}</span>
                    <span className="metric-caption">Serious buyers only</span>
                  </div>
                </div>
              </div>

              <div className="hero-image">
                <div className="hero-image-inner" />
              </div>
            </div>

            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Search by designer, style or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" disabled={searching}>
                {searching ? "Searching…" : "Search"}
              </button>
            </form>
          </section>

          {/* SNAPSHOT BAR */}
          <section className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Live Listings</span>
              <span className="stat-value">{liveCount.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">New this week</span>
              <span className="stat-value">{newThisWeekCount.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Top Designers</span>
              <span className="stat-value">Chanel, Hermès, Rolex</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Offers</span>
              <span className="stat-value">{activeOffersCount.toLocaleString()}</span>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="content-grid">
            {/* LEFT / MAIN COLUMN */}
            <div className="main-column">
              {/* Snapshot */}
              <section className="section">
                <header className="section-header">
                  <div>
                    <p className="section-kicker">Today&apos;s Snapshot</p>
                    <h2 className="section-title">New arrivals &amp; trending now</h2>
                  </div>
                  <Link href="/category/new-arrivals" className="section-link">
                    View all new arrivals
                  </Link>
                </header>

                <div className="snapshot-card">
                  <div className="snapshot-header">
                    <h3 className="snapshot-title">New in this week</h3>
                    <span className="snapshot-badge">
                      +{newThisWeekCount.toLocaleString()} new pieces
                    </span>
                  </div>

                  <div className="snapshot-metrics">
                    <div className="snapshot-metric">
                      <span className="snapshot-label">Bags</span>
                      <span className="snapshot-value">Chanel, Hermès, Louis Vuitton</span>
                    </div>
                    <div className="snapshot-metric">
                      <span className="snapshot-label">Watches</span>
                      <span className="snapshot-value">Rolex, Cartier &amp; more</span>
                    </div>
                    <div className="snapshot-metric">
                      <span className="snapshot-label">Ready-to-wear</span>
                      <span className="snapshot-value">
                        From classics to statement pieces
                      </span>
                    </div>
                  </div>

                  <div className="pill-row">
                    <Link href="/category/new-arrivals" className="pill">
                      Shop new arrivals
                    </Link>
                    <Link href="/category/bags" className="pill-secondary">
                      View designer bags
                    </Link>
                    <Link href="/category/watches" className="pill-secondary">
                      Iconic watches
                    </Link>
                  </div>
                </div>
              </section>

              {/* Trending grid */}
              <section className="section">
                <header className="section-header">
                  <div>
                    <p className="section-kicker">Trending now</p>
                    <h2 className="section-title">What buyers are looking at</h2>
                    <p className="section-body">
                      A peek at how your catalogue and listings will appear to buyers. Every item
                      here is live, vetted and ready to purchase.
                    </p>
                  </div>
                </header>

                {trendingListings.length === 0 ? (
                  <p>No listings yet – once you add items, they&apos;ll appear here.</p>
                ) : (
                  <div className="trend-grid">
                    {trendingListings.map((listing) => {
                      const meta = listing as any;

                      const price =
                        typeof meta.price === "number"
                          ? `US$${meta.price.toLocaleString()}`
                          : typeof meta.price === "string"
                          ? meta.price
                          : "";

                      return (
                        <article key={listing.id} className="trend-card">
                          <div className="trend-image-wrapper">
                            {/* pass listing props directly */}
                            <ProductCard {...listing} />
                          </div>
                          <div className="trend-body">
                            <div className="trend-title">{listing.title}</div>
                            <div className="trend-meta">
                              {meta.designer && <span>{meta.designer}</span>}
                              {meta.category && <span> · {meta.category}</span>}
                            </div>
                            {price && <div className="trend-price">{price}</div>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* How it works */}
              <section className="section">
                <header className="section-header">
                  <div>
                    <p className="section-kicker">How Famous Finds works</p>
                    <h2 className="section-title">Built for serious buyers &amp; sellers</h2>
                  </div>
                </header>

                <ol className="bullet-list">
                  <li className="bullet-item">
                    <span className="bullet-label">1. Sellers apply</span>
                    <span className="bullet-text">
                      Sellers submit their details and sample items. Our team reviews each seller
                      before they can list, helping to keep quality high.
                    </span>
                  </li>
                  <li className="bullet-item">
                    <span className="bullet-label">2. Listings are vetted</span>
                    <span className="bullet-text">
                      Every listing is checked by management before going live. This includes
                      category, pricing, and supporting photos.
                    </span>
                  </li>
                  <li className="bullet-item">
                    <span className="bullet-label">3. Buyers shop safely</span>
                    <span className="bullet-text">
                      Buyers can browse, save to wishlist, and purchase through our secure checkout
                      with clear shipping and returns information.
                    </span>
                  </li>
                  <li className="bullet-item">
                    <span className="bullet-label">4. Management oversees it all</span>
                    <span className="bullet-text">
                      The management dashboard tracks sellers, orders, disputes, payouts and more—
                      built for a proper marketplace, not a hobby shop.
                    </span>
                  </li>
                </ol>
              </section>
            </div>

            {/* RIGHT / SIDEBAR */}
            <aside className="sidebar-column">
              <section className="sidebar-card">
                <h3 className="sidebar-title">Are you a seller?</h3>
                <p className="sidebar-text">
                  Apply to list your authenticated designer pieces with us. We focus on quality,
                  clear photos, and accurate descriptions.
                </p>
                <Link href="/sell" className="sidebar-link">
                  Seller Registration
                </Link>
              </section>

              <section className="sidebar-card">
                <h3 className="sidebar-title">My VIP Profile</h3>
                <p className="sidebar-text">
                  Save favourites, track orders and get notified when your favourite designers
                  drop new pieces.
                </p>
                <Link href="/dashboard" className="sidebar-link">
                  Go to Dashboard
                </Link>
              </section>
            </aside>
          </section>
        </div>
      </main>

      <Footer />

      {/* PAGE-SPECIFIC LAYOUT / STYLING */}
      <style jsx>{`
        .page {
          background: #f7f5f1;
          min-height: 100vh;
        }

        .page-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 48px 24px 72px;
        }

        .hero {
          margin-bottom: 40px;
        }

        .hero-content {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr);
          gap: 32px;
          align-items: stretch;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-kicker {
          margin: 0;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .hero-title {
          margin: 0;
          font-size: 32px;
          line-height: 1.1;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          margin: 0;
          font-size: 15px;
          color: #4b5563;
          max-width: 520px;
        }

        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }

        .btn-primary {
          background: #111827;
          color: #f9fafb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #111827;
        }

        .hero-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 10px;
        }

        .hero-metric {
          min-width: 120px;
        }

        .metric-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #9ca3af;
          margin-bottom: 2px;
        }

        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: 600;
        }

        .metric-caption {
          display: block;
          font-size: 12px;
          color: #6b7280;
        }

        .hero-image {
          position: relative;
        }

        .hero-image-inner {
          border-radius: 28px;
          height: 100%;
          min-height: 220px;
          background: radial-gradient(circle at top, #fef3c7, #f97316),
            radial-gradient(circle at bottom, #dbeafe, #1d4ed8);
          background-blend-mode: multiply;
        }

        .hero-search {
          margin-top: 24px;
          display: flex;
          gap: 10px;
        }

        .hero-search input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .hero-search button {
          padding: 10px 18px;
          border-radius: 999px;
          border: none;
          background: #111827;
          color: #f9fafb;
          font-size: 14px;
          cursor: pointer;
        }

        .stats-bar {
          margin: 8px 0 32px;
          padding: 12px 18px;
          border-radius: 999px;
          background: #fefce8;
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          align-items: center;
          font-size: 13px;
        }

        .stat-item {
          display: flex;
          gap: 6px;
        }

        .stat-label {
          color: #6b7280;
        }

        .stat-value {
          font-weight: 600;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(260px, 1fr);
          gap: 32px;
          align-items: flex-start;
        }

        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 16px;
        }

        .section-kicker {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ca3af;
        }

        .section-title {
          margin: 2px 0 0;
          font-size: 22px;
          font-weight: 600;
        }

        .section-link {
          font-size: 13px;
          color: #111827;
          text-decoration: underline;
          white-space: nowrap;
        }

        .snapshot-card {
          border-radius: 24px;
          background: #ffffff;
          padding: 20px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          font-size: 14px;
        }

        .snapshot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .snapshot-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }

        .snapshot-badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #166534;
        }

        .snapshot-metrics {
          display: grid;
          gap: 6px;
          margin-bottom: 12px;
        }

        .snapshot-label {
          font-size: 12px;
          color: #6b7280;
        }

        .snapshot-value {
          font-size: 13px;
        }

        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pill,
        .pill-secondary {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          text-decoration: none;
        }

        .pill {
          background: #111827;
          color: #f9fafb;
        }

        .pill-secondary {
          background: #e5e7eb;
          color: #111827;
        }

        .trend-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        .trend-card {
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .trend-image-wrapper {
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
        }

        .trend-body {
          padding: 10px 12px 12px;
        }

        .trend-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .trend-meta {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .trend-price {
          font-size: 14px;
          font-weight: 600;
        }

        .bullet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
          font-size: 14px;
        }

        .bullet-item {
          border-radius: 14px;
          padding: 10px 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
        }

        .bullet-label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .bullet-text {
          font-size: 13px;
          color: #4b5563;
        }

        .sidebar-column {
          display: grid;
          gap: 16px;
        }

        .sidebar-card {
          border-radius: 20px;
          background: #ffffff;
          padding: 18px 18px 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
          font-size: 14px;
        }

        .sidebar-title {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 500;
        }

        .sidebar-text {
          margin: 0 0 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .sidebar-link {
          font-size: 13px;
          text-decoration: underline;
          color: #111827;
        }

        @media (max-width: 900px) {
          .page-inner {
            padding: 32px 16px 48px;
          }

          .hero-content {
            grid-template-columns: 1fr;
          }

          .hero-image-inner {
            min-height: 180px;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .stats-bar {
            border-radius: 20px;
          }
        }
      `}</style>
    </>
  );
}
