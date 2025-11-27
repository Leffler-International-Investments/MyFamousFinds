// FILE: /pages/shipping.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ShippingPage() {
  return (
    <div className="page">
      <Head>
        <title>Shipping – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">← Help Center</a>

        <h1>Shipping</h1>
        <p className="intro">How shipping works for buyers and sellers.</p>

        <div className="card">
          <h2>Shipping Method</h2>
          <p>Each seller ships items according to the listing details.</p>
        </div>

        <div className="card">
          <h2>Tracking</h2>
          <p>Tracking numbers appear in your dashboard once uploaded.</p>
        </div>

        <div className="card">
          <h2>Delivery Times</h2>
          <p>Delivery depends on the courier and destination.</p>
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
        h1 {
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
      `}</style>
    </div>
  );
}
