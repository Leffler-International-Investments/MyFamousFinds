// FILE: /pages/about.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <div className="page">
      <Head>
        <title>About – Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>About Famous Finds</h1>
        <p className="intro">
          Famous Finds is a curated marketplace for authenticated, pre-loved
          luxury items. We connect trusted sellers with buyers who care about
          quality, provenance and sustainability.
        </p>

        <div className="card-grid">
          <section className="card">
            <h2>Our mission</h2>
            <p>
              To make buying and selling pre-loved luxury feel as safe, simple
              and enjoyable as buying new — while extending the life of
              exceptional pieces.
            </p>
          </section>

          <section className="card">
            <h2>How we curate</h2>
            <p>
              Every listing is reviewed by our team. We look at photos,
              descriptions, condition and authenticity indicators before an item
              is made visible to buyers.
            </p>
          </section>

          <section className="card">
            <h2>Why it matters</h2>
            <p>
              Luxury pieces are built to last. By keeping them in circulation,
              we reduce waste and give more people access to designs they love.
            </p>
          </section>
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
        h1 {
          font-family: "Georgia", serif;
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 18px;
        }
        .card-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
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
