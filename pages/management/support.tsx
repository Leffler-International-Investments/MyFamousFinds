// FILE: /pages/help.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Help() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Help Center – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1>Help Center</h1>
        <p className="intro">
          Answers to the most common questions about buying, selling, shipping
          and returns on Famous Finds.
        </p>

        <section className="card">
          <h2>Buying on Famous Finds</h2>
          <p>
            All items are reviewed before they go live. Payments are processed
            securely via Stripe and are only released to the seller once the
            order is delivered or your return window passes.
          </p>
          <ul>
            <li>Prices are shown in USD.</li>
            <li>Tax is calculated at checkout where applicable.</li>
            <li>
              You&apos;ll receive order updates by email from Famous Finds.
            </li>
          </ul>
          <p className="small">
            Need more detail? See our{" "}
            <Link href="/buying">Buying guide</Link>.
          </p>
        </section>

        <section className="card">
          <h2>Shipping &amp; delivery</h2>
          <p>
            Shipping is organised by either the seller or Famous Finds,
            depending on the item and location. Tracking details are always
            provided once an order is dispatched.
          </p>
          <p className="small">
            Read the full <Link href="/shipping">Shipping policy</Link>.
          </p>
        </section>

        <section className="card">
          <h2>Returns &amp; refunds</h2>
          <p>
            We want you to be happy with your purchase. For most items there is
            a short inspection window after delivery. If something isn&apos;t as
            described, we&apos;ll work with you and the seller to make it right.
          </p>
          <p className="small">
            See the <Link href="/returns">Returns policy</Link> for full
            details.
          </p>
        </section>

        <section className="card">
          <h2>Selling on Famous Finds</h2>
          <p>
            Sellers submit items for review. We check images, description and
            pricing before items appear in the storefront. Payouts are handled
            via Stripe to your connected bank account.
          </p>
          <p className="small">
            Learn more in the <Link href="/selling">Selling guide</Link>.
          </p>
        </section>

        <section className="card">
          <h2>Still need help?</h2>
          <p>
            If you can&apos;t find what you&apos;re looking for, reach out to our
            team.
          </p>
          <ul>
            <li>
              Send us a message on the <Link href="/contact">Contact page</Link>.
            </li>
            <li>
              Or email{" "}
              <a href="mailto:support@famous-finds.com">
                support@famous-finds.com
              </a>
              .
            </li>
          </ul>
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
