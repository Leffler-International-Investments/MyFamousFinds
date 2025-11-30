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
  // ✅ NEW:
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

// ✅ Helper: convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  try {
    if (!url) return "";
    // watch?v=ID
    const watchMatch = url.match(/v=([^&]+)/);
    if (watchMatch?.[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    // youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch?.[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    return url;
  } catch {
    return url;
  }
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

        {/* FEATURED DESIGNERS CAROUSEL */}
        <section className="home-featured-designers mt-10">
          <header className="home-feed-header">
            <h2 className="home-feed-title">Featured Designers</h2>
          </header>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-4 pt-1">
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

        {/* ✅ DYNAMIC MESSAGE BOARD BANNER */}
        {activeMessages && activeMessages.length > 0 && (
          <section className="buyer-message-board-container">
            {activeMessages.map((msg) => {
              const hasVideo = !!msg.videoUrl;
              const hasImage = !!msg.imageUrl;
              const maybeYouTube =
                hasVideo &&
                (msg.videoUrl!.includes("youtube.com") ||
                  msg.videoUrl!.includes("youtu.be"));

              return (
                <div key={msg.id} className={`buyer-message-board ${msg.type}`}>
                  <div className="message-content">
                    <p>
                      {msg.text}{" "}
                      {msg.linkText && msg.linkUrl && (
                        <Link href={msg.linkUrl} className="catalogue-link">
                          {msg.linkText} →
                        </Link>
                      )}
                    </p>

                    {(hasVideo || hasImage) && (
                      <div className="message-media">
                        {hasVideo ? (
                          maybeYouTube ? (
                            <div className="video-wrapper">
                              <iframe
                                src={getYouTubeEmbedUrl(msg.videoUrl!)}
                                title="Announcement video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <video
                              className="message-media-video"
                              src={msg.videoUrl!}
                              controls
                              playsInline
                            />
                          )
                        ) : (
                          hasImage && (
                            <img
                              className="message-media-image"
                              src={msg.imageUrl!}
                              alt=""
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* NEW ARRIVALS GRID */}
        <section className="home-section">
          <DemoGrid
            title="New Arrivals"
            subtitle="Just in – freshly listed pieces from our vetted sellers."
            products={newArrivals}
          />
        </section>

        {/* TRENDING GRID */}
        <section className="home-section">
          <DemoGrid
            title="Trending Now"
            subtitle="Most-viewed and most-saved listings this week."
            products={trending}
          />
        </section>
      </main>

      <HomepageButler />
      <Footer />

      <style jsx>{`
        .home-wrapper {
          background: #f7f7f5;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 32px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        h1 {
          font-size: 36px;
          line-height: 1.1;
          margin: 0 0 12px;
          font-family: "Georgia", serif;
        }
        .hero-sub {
          color: #4b5563;
          max-width: 520px;
          margin-bottom: 20px;
        }
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) {
          .hero-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          margin: 4px 0;
        }
        .stat-note {
          font-size: 12px;
          color: #9ca3af;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
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
          border: 1px solid transparent;
        }
        .btn-primary {
          background: #111827;
          color: #ffffff;
        }
        .btn-secondary {
          background: #ffffff;
          border-color: #d1d5db;
          color: #111827;
        }
        .snapshot-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 20px 22px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          align-self: flex-start;
        }
        .snapshot-card h2 {
          margin: 0 0 4px;
          font-size: 18px;
        }
        .snapshot-view {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
          margin-bottom: 12px;
        }
        .snapshot-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          padding: 6px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .snapshot-row:last-of-type {
          border-bottom: none;
          margin-bottom: 14px;
        }
        .home-section {
          margin-top: 40px;
        }
        .home-featured-designers {
          margin-top: 40px;
        }
        .home-feed-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
        }
        .home-feed-title {
          font-size: 24px;
          font-weight: 500;
          font-family: "Georgia", serif;
          margin: 0;
        }
        .home-feed-header a {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        .home-feed-header a:hover {
          color: #111827;
          text-decoration: underline;
        }
        .home-featured-designers .flex {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .home-featured-designers .flex::-webkit-scrollbar {
          display: none;
        }
        .home-featured-designers .flex {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* --- MESSAGE BOARD STYLES --- */
        .buyer-message-board-container {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .buyer-message-board {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }

        .buyer-message-board.promo {
          background: #fffbeb;
          border-color: #fcd34d;
          color: #92400e;
        }
        .buyer-message-board.alert {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .buyer-message-board.info {
          background: #f9fafb;
          border-color: #e5e7eb;
          color: #374151;
        }

        .message-content p {
          font-family: "Georgia", serif;
          font-size: 19px;
          margin: 0;
          line-height: 1.5;
        }

        /* ✅ NEW: media styles */
        .message-media {
          margin-top: 16px;
        }
        .message-media-image,
        .message-media-video,
        .video-wrapper iframe {
          max-width: 100%;
          border-radius: 12px;
          display: block;
          margin: 0 auto;
        }
        .message-media-video,
        .video-wrapper iframe {
          max-height: 320px;
        }
        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
        }
        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        :global(.catalogue-link) {
          color: inherit;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: opacity 0.2s;
          margin-left: 4px;
        }

        :global(.catalogue-link:hover) {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default Home;

// --------------------------------------------------
// Server-side data
// --------------------------------------------------

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  // 1. Fetch Listings
  const snapshot = await adminDb
    .collection("listings")
    .where("status", "==", "Live")
    .get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      title: data.title || "",
      brand: data.brand || "",
      price: formatPrice(data.price),
      image: pickImage(data),
      href: `/product/${doc.id}`,
      category: data.category || "",
      condition: data.condition || "",
      createdAt: data.createdAt,
      viewCount: data.viewCount || 0,
    };
  });

  // 2. New Arrivals (Sort by newest)
  const newArrivals = items
    .slice()
    .sort((a: any, b: any) => {
      const aTime =
        a.createdAt && typeof a.createdAt.toMillis === "function"
          ? a.createdAt.toMillis()
          : 0;
      const bTime =
        b.createdAt && typeof b.createdAt.toMillis === "function"
          ? b.createdAt.toMillis()
          : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  // 3. Trending (Sort by viewCount)
  let trending = items
    .slice()
    .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 8);

  if (!trending.length) {
    trending = newArrivals;
  }

  // 4. Featured Designers
  const uniqueBrands = Array.from(
    new Set(items.map((i) => i.brand).filter(Boolean))
  );
  const featuredDesigners = uniqueBrands.sort();
  if (featuredDesigners.length === 0) {
    featuredDesigners.push(
      "Chanel",
      "Louis Vuitton",
      "Hermès",
      "Gucci",
      "Prada"
    );
  }

  // 5. FETCH ACTIVE MESSAGES (now includes image + video)
  let activeMessages: BuyerMessage[] = [];

  try {
    const messagesRef = adminDb.collection("buyer_messages");

    let snap = await messagesRef.where("active", "==", true).get();
    if (snap.empty) {
      snap = await messagesRef.get();
    }

    activeMessages = snap.docs
      .map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          text: d.text || "",
          linkText: d.linkText || "",
          linkUrl: d.linkUrl || "",
          imageUrl: d.imageUrl || "",
          videoUrl: d.videoUrl || "",
          type: (d.type as BuyerMessage["type"]) || "info",
          active: d.active ?? true,
          createdAt: d.createdAt?.toMillis?.() || 0,
        } as BuyerMessage;
      })
      .filter((m) => m.active !== false && m.text.trim().length > 0)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("Error fetching messages:", err);
  }

  return {
    props: {
      trending,
      newArrivals,
      featuredDesigners: featuredDesigners.slice(0, 15),
      activeMessages,
    },
  };
};
