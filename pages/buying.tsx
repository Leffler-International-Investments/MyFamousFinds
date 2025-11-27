// FILE: /pages/buying.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BuyingPage() {
  return (
    <div className="page">
      <Head>
        <title>Buying on Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">← Help Center</a>

        <h1>Buying on Famous Finds</h1>
        <p className="intro">
          Everything you need to know before placing an order.
        </p>

        <div className="card">
          <h2>1. Browsing & Search</h2>
          <p>Explore New Arrivals, categories and designer filters.</p>
        </div>

        <div className="card">
          <h2>2. Authenticity</h2>
          <p>All listings are reviewed for accuracy and compliance.</p>
        </div>

        <div className="card">
          <h2>3. Placing an order</h2>
          <p>Payments are processed securely using our payment provider.</p>
        </div>

        <div className="card">
          <h2>4. Receiving your item</h2>
          <p>Check your item upon arrival and contact support if needed.</p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #fff;
          color: #111;
        }
        .wrap {
          max-width: 900px;
          margin: 24px auto 60px;
          padding: 0 16px;
        }
        .back-link {
          color: #6b7280;
        }
        h1 {
          margin-top: 12px;
          font-family: Georgia, serif;
          font-size: 26px;
        }
        .intro {
          margin-bottom: 18px;
          color: #4b5563;
        }
        .card {
          background: white;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
