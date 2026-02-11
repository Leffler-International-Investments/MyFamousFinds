// FILE: /pages/selling.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellingPage() {
  return (
    <div className="page">
      <Head>
        <title>Selling on Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">← Help Center</a>

        <h1>Selling on Famous Finds</h1>
        <p className="intro">
          How to list items, ship orders and get paid as a seller.
        </p>

        <div className="card">
          <h2>1. Listing your item</h2>
          <p>
            Upload photos, choose the correct category and describe the item accurately.
          </p>
        </div>

        <div className="card">
          <h2>2. Review &amp; Approval</h2>
          <p>
            Our team reviews every listing before it becomes visible in the marketplace.
          </p>
        </div>

        <div className="card">
          <h2>3. Shipping the order</h2>
          <p>
            When your item sells, pack securely, ship on time and upload tracking.
          </p>
        </div>

        <div className="card">
          <h2>4. Getting paid</h2>
          <p>
            Payouts are processed via PayPal to your linked account.
          </p>
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
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        h1 {
          margin: 12px 0;
          font-family: Georgia, serif;
          font-size: 26px;
        }
        .intro {
          color: #4b5563;
          margin-bottom: 18px;
        }
        .card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}
