// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import HomepageButler from "../components/HomepageButler";
import { adminDb } from "../utils/firebaseAdmin";

// --------------------------------------------------
// Types
// --------------------------------------------------

type HomeProps = {
  trending: any[];
  newArrivals: any[];
};

const HomePage: NextPage<HomeProps> = ({ trending, newArrivals }) => {
  return (
    <>
      <Head>
        <title>Famous Finds — Shop authenticated designer pieces</title>
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

      <main className="wrap">
        {/* HERO + SNAPSHOT */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated pre-loved luxury</p>
            <h1>Discover, save &amp; shop authenticated designer pieces.</h1>
            <p className="hero-sub">
              Browse a hand-picked selection of bags, jewelry, watches and
              ready-to-wear from trusted sellers. Every piece is reviewed so you
              can shop with confidence.
            </p>

            <div className="hero-actions">
              <Link href="/catalogue" className="btn btn-primary">
                Browse New Arrivals
              </Link>
              <Link href="/sell" className="btn btn-secondary">
                Apply to Sell
              </Link>
            </div>
          </div>

          <div className="hero-snapshot">
            <div className="snapshot-card">
              <h2>Today&apos;s Snapshot</h2>
              <div className="snapshot-row">
                <span>Live Listings</span>
                <strong>1,284</strong>
              </div>
              <div className="snapshot-row">
                <span>New this week</span>
                <strong>96</strong>
              </div>
              <div className="snapshot-row">
                <span>Top Designers</span>
                <strong>Chanel, Hermès, Rolex</strong>
              </div>
              <div className="snapshot-row">
                <span>Active Offers</span>
                <strong>214</strong>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO GRID (TRENDING & NEW ARRIVALS) */}
        <section className="demo-grid-section">
          <h2 className="section-title">Trending now</h2>
          <p className="section-subtitle">
            A taste of how your catalogue and listings will appear to buyers.
          </p>
          <DemoGrid trending={trending} newArrivals={newArrivals} />
        </section>

        {/* HOW IT WORKS */}
        <section className="how-it-works">
          <h2>How Famous Finds works</h2>
          <div className="how-grid">
            <div className="how-card">
              <h3>1. Sellers apply</h3>
              <p>
                Sellers submit their details and sample items. Our team reviews
                each seller before they can list, helping to keep quality high.
              </p>
            </div>
            <div className="how-card">
              <h3>2. Listings are vetted</h3>
              <p>
                Every listing is checked by management before going live. This
                includes category, pricing, and supporting photos.
              </p>
            </div>
            <div className="how-card">
              <h3>3. Buyers shop safely</h3>
              <p>
                Buyers can browse, save to wishlist, and purchase through our
                secure checkout with clear shipping and returns information.
              </p>
            </div>
            <div className="how-card">
              <h3>4. Management oversees it all</h3>
              <p>
                The management dashboard tracks sellers, orders, disputes,
                payouts and more—built for a proper marketplace, not a hobby
                shop.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNERS */}
        <section className="cta-row">
          <div className="cta-card">
            <h3>Are you a seller?</h3>
            <p>Apply to list your authenticated designer pieces with us.</p>
            <Link href="/seller/register" className="btn btn-primary">
              Seller Registration
            </Link>
          </div>
          <div className="cta-card">
            <h3>Want to join the VIP club?</h3>
            <p>Be first to know about rare drops and special offers.</p>
            <Link href="/club-register" className="btn btn-secondary">
              Join Famous Finds Club
            </Link>
          </div>
        </section>
      </main>

      <HomepageButler />
      <Footer />
    </>
  );
};

export default HomePage;

// --------------------------------------------------
// Server-side data
// --------------------------------------------------

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const snapshot = await adminDb
    .collection("listings")
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  const items: any[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;

    return {
      id: doc.id,
      title: data.title || "Untitled Piece",
      designer: data.designer || "Unknown",
      price: data.price || 0,
      currency: data.currency || "USD",
      images: data.images || [],
      condition: data.condition || "Good",
      category: data.category || "Other",
      subcategory: data.subcategory || "",
      sellerDisplayName: data.sellerDisplayName || "Verified Seller",
      location: data.location || "",
      wishlistCount: data.wishlistCount || 0,
      isFeatured: data.isFeatured || false,
      createdAt: data.createdAt || null,
    };
  });

  const newArrivals = items.slice(0, 8);
  let trending = [...items]
    .sort((a, b) => {
      const wishA = a.wishlistCount || 0;
      const wishB = b.wishlistCount || 0;
      return wishB - wishA;
    })
    .slice(0, 8);

  if (!trending.length) {
    trending = newArrivals;
  }

  return {
    props: {
      trending,
      newArrivals,
    },
  };
};
