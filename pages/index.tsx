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

      {/* HEADER (unchanged) */}
      <Header />

      <main className="home-main">
        <div className="home-inner">

          {/* ---------------------------------- */}
          {/* HERO SECTION */}
          {/* ---------------------------------- */}
          <section className="hero">

            {/* LEFT SIDE */}
            <div className="hero-left">
              <div className="hero-pill">
                <span className="pill-dot" />
                CURATED PRE-LOVED LUXURY
              </div>

              <h1 className="hero-title">
                Discover, save & shop
                <br />
                authenticated designer pieces.
              </h1>

              <p className="hero-sub">
                Browse a hand-picked selection of bags, jewelry, watches and
                ready-to-wear from trusted sellers. Every piece is vetted so you
                can shop with confidence.
              </p>

              {/* HERO STATS */}
              <div className="hero-stats">
                <div className="stat-card">
                  <p className="stat-label">LIVE LISTINGS</p>
                  <p className="stat-value">{totalItems || "20+"}</p>
                  <p className="stat-note">Updated in real time</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">NEW THIS WEEK</p>
                  <p className="stat-value">{newArrivals.length || "10+"}</p>
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

              {/* CTA BUTTONS */}
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

            {/* RIGHT SIDE SNAPSHOT CARD */}
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

          {/* ---------------------------------- */}
          {/* NEW ARRIVALS */}
          {/* ---------------------------------- */}
          <section id="new-arrivals" className="section">
            <div className="section-header">
              <h2>New Arrivals</h2>
              <p className="section-sub">
                Just in – freshly listed pieces from our vetted sellers.
              </p>
            </div>

            {newArrivals.length ? (
              <DemoGrid items={newArrivals} />
            ) : (
              <p className="empty-text">More pieces will appear here soon.</p>
            )}
          </section>

          {/* ---------------------------------- */}
          {/* TRENDING NOW */}
          {/* ---------------------------------- */}
          <section id="trending" className="section">
            <div className="section-header">
              <h2>Trending Now</h2>
              <p className="section-sub">
                Most-viewed and most-saved listings this week.
              </p>
            </div>

            {trending.length ? (
              <DemoGrid items={trending} />
            ) : (
              <p className="empty-text">More pieces will appear here soon.</p>
            )}
          </section>
        </div>
      </main>

      {/* BUTLER */}
      <div className="butler-floating">
        <HomepageButler />
      </div>

      {/* FOOTER */}
      <Footer />

      {/* ---------------------------------- */}
      {/* STYLES */}
      {/* ---------------------------------- */}
      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: #ffffff;
          color: #111;
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

        /* HERO GRID */
        .hero {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
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
          border-radius: 100%;
          background: #22c55e;
        }

        .hero-title {
          font-family: "Georgia", serif;
          font-size: 40px;
          margin-bottom: 10px;
        }

        .hero-sub {
          color: #666;
          margin-bottom: 22px;
          font-size: 14px;
          max-width: 520px;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        @media (max-width: 900px) {
          .hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 12px;
          background: white;
        }

        .stat-label {
          font-size: 11px;
          color: #9ca3af;
          letter-spacing: 0.12em;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
        }

        .stat-note {
          font-size: 11px;
          color: #9ca3af;
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
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.15s;
        }

        .btn-primary {
          background: #111;
          color: #fff;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #111;
        }
        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-outline {
          background: #fff;
          border: 1px dashed #ccc;
          color: #666;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .btn-outline:hover {
          border-color: #111;
          color: #111;
        }

        .snapshot-card {
          border-radius: 20px;
          border: 1px solid #e5e5e5;
          background: white;
          padding: 22px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.04);
        }

        .snapshot-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .snapshot-header h2 {
          font-size: 14px;
          font-weight: 600;
        }

        .snapshot-badge {
          padding: 4px 9px;
          background: #f3f4f6;
          color: #666;
          border-radius: 999px;
          font-size: 11px;
        }

        .snapshot-rows {
          background: #fafafa;
          padding: 10px 12px;
          border-radius: 14px;
          margin-bottom: 14px;
        }

        .snapshot-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }

        .snapshot-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full {
          width: 100%;
        }

        .section {
          margin-top: 45px;
        }

        .section-header h2 {
          font-family: "Georgia", serif;
          font-size: 26px;
          margin-bottom: 5px;
        }

        .section-sub {
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .empty-text {
          font-size: 13px;
          color: #999;
        }

        .butler-floating {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 40;
        }
      `}</style>
    </div>
  );
};

/* ----------------------------------------------------------- */
/* BACKEND CONNECTION (REAL LISTINGS) */
/* ----------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  let trending: ProductLike[] = [];
  let newArrivals: ProductLike[] = [];

  try {
    const allowedStatuses = ["Live", "Active", "Approved"];

    // TRENDING
    const trendingSnap = await adminDb
      .collection("listings")
      .where("status", "in", allowedStatuses)
      .where("isTrending", "==", true)
      .limit(12)
      .get();

    trending = trendingSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const priceNum = Number(d.price) || 0;

      const image =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      return {
        id: doc.id,
        title: d.title || "",
        brand: d.brand || "",
        price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
        image,
        href: `/product/${doc.id}`,
      };
    });

    // NEW ARRIVALS
    const arrivalsSnap = await adminDb
      .collection("listings")
      .where("status", "in", allowedStatuses)
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();

    newArrivals = arrivalsSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const priceNum = Number(d.price) || 0;

      const image =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      return {
        id: doc.id,
        title: d.title || "",
        brand: d.brand || "",
        price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
        image,
        href: `/product/${doc.id}`,
      };
    });
  } catch (err) {
    console.error("Homepage Firestore error:", err);
  }

  return {
    props: {
      trending,
      newArrivals,
    },
  };
};

export default Home;
