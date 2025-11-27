// FILE: /pages/help/selling.tsx

import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellingHelpPage() {
  return (
    <div className="page">
      <Head>
        <title>Selling on Famous Finds – Help</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">
          ← Help Center
        </a>

        <h1>Selling on Famous Finds</h1>
        <p className="intro">
          A quick overview of how to list items, manage orders and get paid as a
          seller on Famous Finds.
        </p>

        <div className="card">
          <h2>1. Listing your item</h2>
          <p>
            Create a new listing from your seller dashboard. Add clear photos,
            describe the condition honestly and choose the correct designer and
            category.
          </p>
        </div>

        <div className="card">
          <h2>2. Review &amp; approval</h2>
          <p>
            Our team reviews each listing for completeness, brand accuracy and
            policy compliance. Approved items go live in the marketplace and can
            appear in search, New Arrivals and designer pages.
          </p>
        </div>

        <div className="card">
          <h2>3. Shipping the order</h2>
          <p>
            When an item sells, you&apos;ll receive an order notification and
            shipping instructions. Pack the item securely and dispatch within
            the agreed time frame, then upload tracking so the buyer can follow
            the delivery.
          </p>
        </div>

        <div className="card">
          <h2>4. Getting paid</h2>
          <p>
            Payouts are processed via Stripe Connect to your nominated bank
            account. You can track balances and payouts in your Wallet and
            monthly statements.
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #111827;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 900px;
          margin: 24px auto 60px;
          padding: 0 16px;
        }
        .back-link {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        .back-link:hover {
          color: #111827;
        }
        h1 {
          margin-top: 12px;
          font-family: "Georgia", serif;
          font-size: 26px;
        }
        .intro {
          margin-top: 6px;
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 18px;
        }
        .card {
          background: #ffffff; /* WHITE, not black */
          color: #111827;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
