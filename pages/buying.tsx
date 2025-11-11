// FILE: /pages/buying.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Buying() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Buying on Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1>Buying guide</h1>
        <p className="intro">
          Everything you need to know about shopping safely on Famous Finds.
        </p>

        <section className="card">
          <h2>Authenticity &amp; review</h2>
          <p>
            Every listing is reviewed before it goes live. For higher-value
            items we may request extra images or documents from the seller to
            support our authenticity checks.
          </p>
        </section>

        <section className="card">
          <h2>Payments &amp; security</h2>
          <ul>
            <li>All payments are processed securely via Stripe.</li>
            <li>Your card details are handled by Stripe, not stored by us.</li>
            <li>
              Orders are only paid out to the seller after delivery or once the
              inspection window closes.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Fees &amp; taxes</h2>
          <p>
            Prices shown on the site are for the item only. Shipping and any
            applicable taxes are calculated at checkout before you confirm
            payment so there are no surprises.
          </p>
        </section>

        <section className="card">
          <h2>Need help with an order?</h2>
          <p>
            If something doesn&apos;t look right with your order, contact our
            team and we&apos;ll investigate.
          </p>
          <p className="small">
            Visit the <Link href="/help">Help Center</Link> or{" "}
            <Link href="/contact">contact us</Link>.
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
