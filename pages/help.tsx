// FILE: /pages/help.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HelpPage() {
  return (
    <div className="page">
      <Head>
        <title>Help Center – MyFamousFinds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Help Center</h1>
        <p className="intro">
          Answers to the most common questions about buying, selling, shipping
          and returns on MyFamousFinds.
        </p>

        <div className="card-grid">
          <section className="card">
            <h2>Buying on MyFamousFinds</h2>
            <p>
              All items are reviewed before they go live. Orders are paid
              securely via PayPal and your item is delivered to your chosen
              address.
            </p>
            <Link href="/buying" className="card-link">
              Read the Buying guide &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Shipping &amp; Delivery</h2>
            <p>
              Shipping is organised by either the seller or MyFamousFinds,
              depending on the listing. Tracking details are provided where
              available.
            </p>
            <Link href="/shipping" className="card-link">
              Read the Shipping &amp; Delivery policy &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Returns &amp; Refunds</h2>
            <p>
              We want you to be happy with your purchase. Our Returns policy
              explains when refunds are available and how to lodge a claim.
            </p>
            <Link href="/returns" className="card-link">
              See the Returns policy &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Selling on MyFamousFinds</h2>
            <p>
              Sellers submit items for review. We check photos, descriptions and
              condition before items appear in the storefront. Payouts are sent
              once an order is completed.
            </p>
            <Link href="/selling" className="card-link">
              Read the Selling guide &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Seller Terms &amp; Conditions</h2>
            <p>
              Our Seller T&amp;Cs cover commissions, shipping deadlines,
              prohibited items, account conduct and everything else sellers need
              to know.
            </p>
            <Link href="/seller-terms" className="card-link">
              Read the Seller T&amp;Cs &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Terms &amp; Conditions</h2>
            <p>
              The general Terms &amp; Conditions that apply to all users of the
              MyFamousFinds platform, including buyers and visitors.
            </p>
            <Link href="/terms" className="card-link">
              Read the Terms &amp; Conditions &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Privacy Policy</h2>
            <p>
              How we collect, use, store and protect your personal data when you
              use MyFamousFinds.
            </p>
            <Link href="/privacy" className="card-link">
              Read the Privacy Policy &rarr;
            </Link>
          </section>

          <section className="card">
            <h2>Still need help?</h2>
            <p>
              If you can&apos;t find what you&apos;re looking for, reach out to
              our team:
            </p>
            <ul>
              <li>
                <Link href="/contact">Send us a message on the Contact page</Link>
              </li>
              <li>
                Or email{" "}
                <a href="mailto:support@myfamousfinds.com">
                  support@myfamousfinds.com
                </a>
              </li>
            </ul>
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
          margin-top: 12px;
          font-family: "Georgia", serif;
          font-size: 26px;
        }
        .intro {
          margin-top: 6px;
          color: #4b5563;
          font-size: 14px;
        }
        .card-grid {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card {
          background: #ffffff;
          color: #111827;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card p,
        .card li {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
        .card ul {
          margin-top: 6px;
          padding-left: 20px;
          list-style: disc;
        }
        :global(.card-link) {
          display: inline-block;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          text-decoration: none;
          transition: color 0.15s;
        }
        :global(.card-link:hover) {
          color: #6366f1;
        }
        @media (max-width: 600px) {
          .card {
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
