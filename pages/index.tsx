// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import HomepageButler from "../components/HomepageButler";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";

// --------------------------------------------------
// Types
// --------------------------------------------------

type BuyerMessage = {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  type: "info" | "promo" | "alert";
  active?: boolean;
  createdAt?: number;
};

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
  featuredDesigners: string[];
  activeMessages: BuyerMessage[];
};

// Helper to normalise price
const formatPrice = (raw: any): string => {
  const num = typeof raw === "number" ? raw : Number(raw || 0);
  if (!num) return "";
  return `US$${num.toLocaleString()}`;
};

// Helper to pick first usable image
const pickImage = (data: any): string => {
  if (data.image_url) return data.image_url;
  if (data.imageUrl) return data.imageUrl;
  if (data.image) return data.image;
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    return data.imageUrls[0];
  }
  return "";
};

// --------------------------------------------------
// Component
// --------------------------------------------------

const Home: NextPage<HomeProps> = ({
  trending,
  newArrivals,
  featuredDesigners,
  activeMessages,
}) => {
  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — Shop authenticated designer pieces</title>
        <meta
          name="description"
          content="Discover curated, authenticated pre-loved designer bags, jewelry, watches and ready-to-wear from trusted sellers."
        />
      </Head>

      <Header />

      <main className="wrap">
        {/* HERO + SNAPSHOT */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated pre-loved luxury</p>
            <h1>Discover, save &amp; shop authenticated designer pieces.</h1>
            <p className="hero-sub">
              Browse a hand-picked selection of bags, jewelry, watches and
              ready-to-wear from trusted sellers. Every piece is vetted so you
              can shop with confidence.
            </p>

            {/* STAT CARDS */}
            <div className="hero-stats">
              <div className="stat-card">
                <p className="stat-label">Live listings</p>
                <p className="stat-value">
                  {newArrivals.length > 20 ? "20+" : newArrivals.length}
                </p>
                <p className="stat-note">Updated in real time</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">New this week</p>
                <p className="stat-value">
                  {newArrivals.length > 10 ? "10+" : newArrivals.length}
                </p>
                <p className="stat-note">Fresh drops &amp; finds</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Designers</p>
                <p className="stat-value">{featuredDesigners.length}+</p>
                <p className="stat-note">From Chanel to Rolex</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Authentication</p>
                <p className="stat-value">100%</p>
                <p className="stat-note">Every piece reviewed</p>
              </div>
            </div>

            <div className="hero-actions">
              <Link href="/category/new-arrivals" className="btn-primary">
                Browse New Arrivals
              </Link>
              <Link href="/designers" className="btn-secondary">
                View Trending Pieces
              </Link>
            </div>
          </div>

          {/* SNAPSHOT CARD */}
          <aside className="snapshot-card">
            <h2>Your Famous Finds Snapshot</h2>
            <p className="snapshot-view">Guest view</p>
            <div className="snapshot-row">
              <span>Saved Items</span>
              <span>0</span>
            </div>
            <div className="snapshot-row">
              <span>Recently Viewed</span>
              <span>0</span>
            </div>
            <div className="snapshot-row">
              <span>Active Offers</span>
              <span>0</span>
            </div>

            <Link
              href="/buyer/dashboard"
              className="block w-full bg-slate-900 text-white rounded-full py-3 text-center text-sm font-medium"
            >
              Sign in to view your dashboard
            </Link>

            <Link
              href="/buyer/signup"
              className="block w-full border border-gray-300 text-gray-700 rounded-full py-3 mt-3 text-center text-sm font-medium"
            >
              Create a free buyer account
            </Link>
          </aside>
        </section>

        {/* FEATURED DESIGNERS SECTION - RE-STABILIZED */}
        <section className="home-featured-designers mt-10">
          <header className="home-feed-header">
            <h2 className="home-feed-title">Featured Designers</h2>
          </header>

          <div className="designer-scroll-container">
            {featuredDesigners.length > 0 ? (
              featuredDesigners.map((name) => (
                <Link
                  href={`/designers?designer=${encodeURIComponent(name)}`}
                  key={name}
                  className="luxury-pill"
                >
                  {name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400">Loading designers...</p>
            )}
          </div>
        </section>

        {/* MESSAGE BOARD */}
        {activeMessages && activeMessages.length > 0 && (
          <section className="buyer-message-board-container">
            <div className="buyer-message-board billboard">
              <div className="billboard-header">
                <h2>Announcements</h2>
                <p>Latest messages from Famous Finds</p>
              </div>
              <div className="billboard-body">
                {activeMessages.map((msg) => (
                  <div key={msg.id} className={`billboard-item ${msg.type}`}>
                    <p className="billboard-text">
                      {msg.text}{" "}
                      {msg.linkText && msg.linkUrl && (
                        <Link href={msg.linkUrl} className="catalogue-link">
                          {msg.linkText} →
                        </Link>
                      )}
                    </p>
                    {(msg.videoUrl || msg.imageUrl) && (
                      <div className="message-media">
                        {msg.videoUrl && (
                          <p className="video-link">
                            <a href={msg.videoUrl} target="_blank" rel="noopener noreferrer">
                              Watch video →
                            </a>
                          </p>
                        )}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="" className="message-media-image" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="home-section">
          <DemoGrid title="New Arrivals" products={newArrivals} />
        </section>

        <section className="home-section">
          <DemoGrid title="Trending Now" products={trending} />
        </section>
      </main>

      <HomepageButler />
      <Footer />

      <style jsx>{`
        .home-wrapper { background: #f7f7f5; }
        .wrap { max-width: 1200px; margin: 0 auto; padding: 32px 16px 64px; }
        .hero { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 32px; margin-bottom: 40px; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
        .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; color: #6b7280; margin-bottom: 8px; }
        h1 { font-size: 36px; line-height: 1.1; margin: 0 0 12px; font-family: "Georgia", serif; }
        .hero-sub { color: #4b5563; max-width: 520px; margin-bottom: 20px; }
        .hero-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 900px) { .hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .stat-card { background: #ffffff; border-radius: 16px; padding: 12px 14px; border: 1px solid #e5e7eb; }
        .stat-label { font-size: 11px; text-transform: uppercase; color: #6b7280; }
        .stat-value { font-size: 18px; font-weight: 600; margin: 4px 0; }
        .stat-note { font-size: 12px; color: #9ca3af; }
        
        /* TWO-ROW GRID LAYOUT */
        .designer-scroll-container {
          display: flex;
          flex-flow: column wrap;
          gap: 12px;
          margin-top: 16px;
          height: 110px; 
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 12px;
        }
        .designer-scroll-container::-webkit-scrollbar { height: 4px; }
        .designer-scroll-container::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        :global(.luxury-pill) {
          white-space: nowrap;
          padding: 8px 20px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          font-size: 14px;
          color: #111;
          transition: all 0.2s ease;
        }

        .snapshot-card { background: #ffffff; border-radius: 24px; padding: 20px 22px; border: 1px solid #e5e7eb; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); align-self: flex-start; }
        .btn-primary { background: #111827; color: #ffffff; padding: 10px 18px; border-radius: 999px; text-decoration: none; }
        .btn-secondary { background: #ffffff; border: 1px solid #d1d5db; color: #111827; padding: 10px 18px; border-radius: 999px; text-decoration: none; }
      `}</style>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const snapshot = await adminDb
    .collection("listings")
    .where("status", "==", "Live")
    .get();

  const allItems = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      brand: data.brand || "",
      price: formatPrice(data.price),
      image: pickImage(data),
      href: `/product/${doc.id}`,
      viewCount: data.viewCount || 0,
      createdAt: data.createdAt,
    };
  });

  // Correctly extract and sort unique brands for the list
  const featuredDesigners = Array.from(new Set(allItems.map((i) => i.brand).filter(Boolean))).sort();

  const newArrivals = [...allItems]
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    .slice(0, 8);

  const trending = [...allItems]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 8);

  let activeMessages: BuyerMessage[] = [];
  try {
    const messagesRef = adminDb.collection("buyer_messages");
    let msgSnap = await messagesRef.where("active", "==", true).get();
    activeMessages = msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuyerMessage));
  } catch (err) { console.error(err); }

  return {
    props: {
      trending,
      newArrivals,
      featuredDesigners,
      activeMessages,
    },
  };
};
