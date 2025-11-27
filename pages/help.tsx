// FILE: /pages/help.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HelpPage() {
  return (
    <div className="page">
      <Head>
        <title>Help Center – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/dashboard" className="back-link">
          ← Back to Dashboard
        </a>

        <h1>Help Center</h1>
        <p className="intro">
          Answers to the most common questions about buying, selling, shipping
          and returns on Famous Finds.
        </p>

        <div className="card-grid">
          <section className="card">
            <h2>Buying on Famous Finds</h2>
            <p>
              All items are reviewed before they go live. Orders are paid
              securely and your item is delivered to your chosen address.
            </p>
            <p className="more">
              Need more detail? See our Buying guide.
            </p>
          </section>

          <section className="card">
            <h2>Shipping &amp; delivery</h2>
            <p>
              Shipping is organised by either the seller or Famous Finds,
              depending on the listing. Tracking details are provided where
              available.
            </p>
            <p className="more">Read the full Shipping policy.</p>
          </section>

          <section className="card">
            <h2>Returns &amp; refunds</h2>
            <p>
              We want you to be happy with your purchase. Our Returns policy
              explains when refunds are available and how to lodge a claim.
            </p>
            <p className="more">See the Returns policy for full details.</p>
          </section>

          <section className="card">
            <h2>Selling on Famous Finds</h2>
            <p>
              Sellers submit items for review. We check photos, descriptions and
              condition before items appear in the storefront. Payouts are sent
              to your connected bank account once an order is completed.
            </p>
            <p className="more">Learn more in the Selling guide.</p>
          </section>

          <section className="card">
            <h2>Still need help?</h2>
            <p>
              If you can&apos;t find what you&apos;re looking for, reach out to
              our team:
            </p>
            <ul>
              <li>Send us a message on the Contact page</li>
              <li>
                Or email{" "}
                <a href="mailto:support@famous-finds.com">
                  support@famous-finds.com
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
        }
        .card-grid {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card {
          background: #ffffff; /* WHITE */
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
        .more {
          margin-top: 8px;
          font-size: 13px;
          color: #111827;
          font-weight: 500;
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
