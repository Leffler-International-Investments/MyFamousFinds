// FILE: /pages/returns.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ReturnsPage() {
  return (
    <div className="page">
      <Head>
        <title>Returns & Refunds – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">← Help Center</a>

        <h1>Returns & Refunds</h1>
        <p className="intro">
          When returns may be available and how to request support.
        </p>

        <div className="card">
          <h2>When returns apply</h2>
          <p>If an item is not as described, damaged or authenticity-related.</p>
        </div>

        <div className="card">
          <h2>How to request a return</h2>
          <p>Contact support with photos and description of the issue.</p>
        </div>

        <div className="card">
          <h2>Refund Processing</h2>
          <p>Refunds go back to your card once approved by support.</p>
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
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
