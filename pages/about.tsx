// FILE: /pages/about.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>About – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1>About Famous Finds</h1>
        <p className="intro">
          Famous Finds is a curated marketplace for authenticated luxury and
          premium fashion. Every item is reviewed before it goes live so buyers
          can shop with confidence and sellers can reach the right audience.
        </p>

        <section className="card">
          <h2>Our mission</h2>
          <p>
            We celebrate pieces that deserve a second life — from iconic bags
            and watches to everyday wardrobe heroes. Our goal is to make
            resale feel as special as buying new, with a smoother experience
            and stronger protections for both buyers and sellers.
          </p>
        </section>

        <section className="card">
          <h2>What makes us different</h2>
          <ul>
            <li>Every listing is reviewed before it appears in the store.</li>
            <li>
              Items are inspected and authenticated through the Famous Finds
              concierge.
            </li>
            <li>
              Funds are held securely until the order has been delivered and
              checked.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Our community</h2>
          <p>
            Our community is global and inclusive – different sizes, different
            colours, different stories – all sharing a love of beautiful,
            well-made pieces. Whether you&apos;re buying your first designer bag
            or curating a collection, we want Famous Finds to feel like home.
          </p>
          <p className="small">
            Have questions or ideas?{" "}
            <Link href="/contact">Get in touch with the team.</Link>
          </p>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          font-size: 26px;
          margin-top: 8px;
          margin-bottom: 10px;
        }
        .intro {
          font-size: 14px;
          color: #d4d4d4;
          margin-bottom: 20px;
        }
        .card {
          border-radius: 16px;
          border: 1px solid #27272a;
          background: #020617;
          padding: 16px 18px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #e5e5e5;
        }
        .card h2 {
          font-size: 16px;
          margin-bottom: 6px;
        }
        .card ul {
          margin: 8px 0 0;
          padding-left: 18px;
          list-style: disc;
          color: #d4d4d4;
        }
        .card li + li {
          margin-top: 4px;
        }
        .small {
          font-size: 12px;
          color: #a1a1aa;
          margin-top: 10px;
        }
        a {
          color: #a5b4fc;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .back-link {
          display: inline-block;
          font-size: 12px;
          color: #a1a1aa;
          margin-bottom: 4px;
          text-decoration: none;
        }
        .back-link:hover {
          color: #e5e5e5;
        }
      `}</style>
    </div>
  );
}
