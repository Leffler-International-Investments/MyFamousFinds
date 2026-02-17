// FILE: /pages/consign.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ConsignPage() {
  return (
    <div className="consign-page">
      <Head>
        <title>Consign with Famous Finds</title>
        <meta
          name="description"
          content="Consign your luxury pieces with Famous Finds and reach vetted buyers worldwide."
        />
      </Head>

      <Header />

      <main className="consign-main">
        <section className="consign-hero">
          <p className="consign-eyebrow">Consign with confidence</p>
          <h1>Let Famous Finds handle the details.</h1>
          <p className="consign-subtitle">
            Submit your luxury pieces for authentication, pricing guidance, and
            a curated listing experience. Our team handles the heavy lifting so
            you can focus on the next find.
          </p>
          <div className="consign-actions">
            <Link href="/seller/register-vetting" className="consign-primary">
              Start consigning
            </Link>
            <Link href="/contact" className="consign-secondary">
              Talk to our team
            </Link>
          </div>
        </section>

        <section className="consign-grid">
          <article className="consign-card">
            <h2>White-glove listing support</h2>
            <p>
              Our specialists help verify, price, and position each item to
              reach the right buyers.
            </p>
          </article>
          <article className="consign-card">
            <h2>Trusted authentication</h2>
            <p>
              Every item is reviewed for authenticity before it goes live to
              keep the marketplace safe.
            </p>
          </article>
          <article className="consign-card">
            <h2>Faster payout options</h2>
            <p>
              Once your item sells, track your payout right from the Seller
              dashboard.
            </p>
          </article>
        </section>

        <section className="consign-steps">
          <h2>How consignment works</h2>
          <ol>
            <li>Submit your item details and photos.</li>
            <li>We authenticate and approve the listing.</li>
            <li>Your item goes live to vetted buyers.</li>
            <li>Ship and get paid after the sale.</li>
          </ol>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .consign-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
        }
        .consign-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 16px 72px;
        }
        .consign-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .consign-eyebrow {
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 36px;
          margin: 0 0 12px;
        }
        .consign-subtitle {
          max-width: 640px;
          margin: 0 auto 20px;
          color: #4b5563;
          line-height: 1.6;
        }
        .consign-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .consign-primary,
        .consign-secondary {
          display: inline-block;
          border-radius: 999px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .consign-primary:hover,
        .consign-secondary:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .consign-primary {
          background: #111827;
          color: #ffffff;
          border: 2px solid #111827;
        }
        .consign-secondary {
          background: #ffffff;
          color: #111827;
          border: 2px solid #111827;
        }
        .consign-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-bottom: 40px;
        }
        .consign-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          background: #fafafa;
        }
        .consign-card h2 {
          margin: 0 0 8px;
          font-size: 16px;
        }
        .consign-card p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }
        .consign-steps {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
        }
        .consign-steps h2 {
          margin-top: 0;
          font-size: 20px;
        }
        .consign-steps ol {
          margin: 12px 0 0;
          padding-left: 18px;
          color: #374151;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
