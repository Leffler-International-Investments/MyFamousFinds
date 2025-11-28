import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import FeaturedDesigners from "../components/FeaturedDesigners";
import NewArrivals from "../components/NewArrivals";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Famous Finds — Discover, save & shop authenticated designer pieces</title>

        {/* Google Search Console Verification */}
        <meta
          name="google-site-verification"
          content="RQh6GnJJ4BngX_4si1xGlYpnL9_7Z5srwkz1P3YSrhk"
        />

        {/* Bing Webmaster Tools Verification */}
        <meta
          name="msvalidate.01"
          content="1A5F9E495867B41926D6E2C113347122"
        />

        {/* Basic SEO */}
        <meta
          name="description"
          content="Browse and shop authenticated designer bags, jewelry, watches and more from trusted verified sellers."
        />
      </Head>

      <Header />

      <main className="homepage-container">
        <section className="hero-section">
          <h1>Discover, save & shop authenticated designer pieces.</h1>
          <p>
            Browse a hand-picked selection of bags, jewelry, watches and ready-to-wear
            from trusted vetted sellers. Every piece is reviewed so you can shop with confidence.
          </p>

          <div className="hero-buttons">
            <Link href="/new-arrivals" className="btn-primary">
              Browse New Arrivals
            </Link>
            <Link href="/trending" className="btn-secondary">
              View Trending Pieces
            </Link>
          </div>
        </section>

        <FeaturedDesigners />
        <NewArrivals />
      </main>

      <Footer />
    </>
  );
}
