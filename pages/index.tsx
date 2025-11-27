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
    <div className="home-page">
      <Head>
        <title>Famous Finds – Curated Luxury Resale</title>
      </Head>

      {/* HEADER – leave as is */}
      <Header />

      <main className="home-main">
        <div className="home-inner">
          {/* HERO */}
          <section className="hero">
            {/* LEFT */}
            <div className="hero-left">
              <div className="hero-pill">
                <span className="pill-dot" />
                CURATED PRE-LOVED LUXURY
              </div>

              <h1 className="hero-title">
                Discover, save &amp; shop
                <br />
                authenticated designer pieces.
              </h1>

              <p className="hero-sub">
                Browse a hand-picked selection of bags, jewelry, watches and
                ready-to-wear from trusted sellers. Every piece is vetted so you
                can shop with confidence.
              </p>

              <div className="hero-stats">
                <div className="stat-card">
                  <p className="stat-label">LIVE LISTINGS</p>
                  <p className="stat-value">{totalItems || "20+"}</p>
                  <p className="stat-note">Updated in real time</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">NEW THIS WEEK</p>
                  <p className="stat-value">
                    {newArrivals.length || "10+"}
                  </p>
                  <p className="stat-note">Fresh drops &amp; finds</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">DESIGNERS</p>
                  <p className="stat-value">50+</p>
                  <p className="stat-note">From Chanel to Rolex</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">AUTHENTICATION</p>
                  <p className="stat-value">100%</p>
                  <p className="stat-note">Every piece reviewed</p>
                </div>
              </div>

              <div className="hero-actions">
                <a href="#new-arrivals" className="btn-primary">
                  Browse New Arrivals
                </a>
                <a href="#trending" className="btn-secondary">
                  View Trending Pieces
                </a>
                <a href="/designers" className="btn-outline">
                  Shop by Designer
                </a>
              </div>
            </div>

            {/* RIGHT – snapshot card */}
            <aside className="snapshot-card">
              <div className="snapshot-header">
                <h2>Your Famous Finds Snapshot</h2>
                <span className="snapshot-badge">Guest view</span>
              </div>
              <div className="snapshot-rows">
                <div className="snapshot-row">
                  <span>Saved Items</span>
                  <strong>0</strong>
                </div>
                <div className="snapshot-row">
                  <span>Recently Viewed</span>
                  <strong>0</strong>
                </div>
                <div className="snapshot-row">
                  <span>Active Offers</span>
                  <strong>0</strong>
                </div>
              </div>
              <div className="snapshot-actions">
                <button className="btn-primary full">
                  Sign in to view your dashboard
                </button>
                <button className="btn-secondary full">
                  Create a free buyer account
                </button>
              </div>
            </aside>
          </section>

          {/* CATEGORY SHORTCUTS */}
          <section className="section section-categories">
            <div className="section-header">
              <h2>Shop by Category</h2>
            </div>
            <div className="category-pills">
              <a href="/category/women" className="pill-link">
                Women
              </a>
              <a href="/category/bags" className="pill-link">
                Bags
              </a>
              <a href="/category/jewelry" className="pill-link">
                Jewelry
              </a>
              <a href="/category/watches" className="pill-link">
                Watches
              </a>
              <a href="/designers" className="pill-link">
                All Designers
              </a>
            </div>
          </section>

          {/* NEW ARRIVALS */}
          <section id="new-arrivals" className="section">
            <div className="section-header">
              <div>
                <h2>New Arrivals</h2>
                <p className="section-sub">
                  Just in – freshly listed pieces from our vetted sellers.
                </p>
              </div>
            </div>

            {newArrivals.length ? (
              <DemoGrid items={newArrivals} />
            ) : (
              <p className="empty-text">More pieces will appear here soon.</p>
            )}
          </section>

          {/* TRENDING */}
          <section id="trending" className="section">
            <div className="section-header">
              <div>
                <h2>Trending Now</h2>
                <p className="section-sub">
                  Most-viewed and most-saved listings this week.
                </p>
              </div>
            </div>

            {trending.length ? (
              <DemoGrid items={trending} />
            ) : (
              <p className="empty-text">More pieces will appear here soon.</p>
            )}
          </section>
        </div>
      </main>

      {/* FLOATING BUTLER – unchanged */}
      <div className="butler-floating">
        <HomepageButler />
      </div>

      {/* FOOTER – unchanged */}
      <Footer />

      {/* PAGE-SCOPED STYLES */}
      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: #ffffff;
          color: #111111;
          display: flex;
          flex-direction: column;
        }

        .home-main {
          flex: 1;
          padding: 40px 16px 60px;
        }

        .home-inner {
          max-width: 1150px;
          margin: 0 auto;
        }

        /* HERO */

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
          gap: 32px;
          align-items: flex-start;
        }

        @media (max-width: 880px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }

        .hero-left {
          max-width: 640px;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid #e5e5e5;
          background: #faf9f6;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b6b6b;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #22c55e;
        }

        .hero-title {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 32px;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 0 0 10px;
        }

        @media (min-width: 960px) {
          .hero-title {
            font-size: 40px;
          }
        }

        .hero-sub {
          margin: 0 0 22px;
          font-size: 14px;
          color: #666666;
          max-width: 520px;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        @media (max-width: 960px) {
          .hero-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .stat-card {
          border-radius: 16px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          padding: 10px 14px;
        }

        .stat-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .stat-note {
          font-size: 11px;
          color: #9ca3af;
          margin: 0;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-outline {
          border-radius: 999px;
          padding: 11px 20px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.16s ease, color 0.16s ease,
            border-color 0.16s ease, opacity 0.16s ease;
          white-space: nowrap;
        }

        .btn-primary {
          background: #111111;
          color: #ffffff;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #111111;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-outline {
          border: 1px dashed #d1d5db;
          background: #ffffff;
          color: #6b7280;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .btn-outline:hover {
          border-color: #111111;
          color: #111111;
        }

        .btn-primary.full,
        .btn-secondary.full {
          width: 100%;
        }

        /* SNAPSHOT CARD */

        .snapshot-card {
          border-radius: 20px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          padding: 20px 22px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.04);
        }

        .snapshot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .snapshot-header h2 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .snapshot-badge {
          padding: 4px 9px;
          border-radius: 999px;
          background: #f3f4f6;
          font-size: 11px;
          color: #6b7280;
        }

        .snapshot-rows {
          border-radius: 14px;
          background: #fafafa;
          padding: 10px 12px;
          margin-bottom: 14px;
        }

        .snapshot-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 4px 0;
        }

        .snapshot-row span {
          color: #6b7280;
        }

        .snapshot-row strong {
          font-weight: 600;
        }

        .snapshot-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* SECTIONS */

        .section {
          margin-top: 40px;
        }

        .section-header h2 {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 24px;
          margin: 0 0 4px;
        }

        .section-sub {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .section-categories {
          border-top: 1px solid #f3f4f6;
          padding-top: 22px;
        }

        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .pill-link {
          border-radius: 999px;
          border: 1px solid #e5e5e5;
          padding: 7px 16px;
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
          transition: border-color 0.16s ease, color 0.16s ease,
            background 0.16s ease;
        }

        .pill-link:hover {
          border-color: #111111;
          color: #111111;
          background: #f9fafb;
        }

        .empty-text {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 20px;
        }

        /* BUTLER */

        .butler-floating {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 40;
        }

        @media (max-width: 600px) {
          .home-main {
            padding-top: 24px;
          }
          .snapshot-card {
            max-width: 400px;
          }
        }
      `}</style>
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
