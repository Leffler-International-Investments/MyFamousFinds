// FILE: /pages/shipping.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Shipping() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Shipping – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1>Shipping</h1>
        <p className="intro">
          This page explains how shipping works for orders placed on Famous
          Finds.
        </p>

        <section className="card">
          <h2>Where we ship</h2>
          <p>
            At this stage Famous Finds is focused on{" "}
            <strong>US-based buyers and sellers</strong>. Most items ship
            domestically within the United States.
          </p>
        </section>

        <section className="card">
          <h2>Shipping methods</h2>
          <ul>
            <li>Tracked shipping is required for all orders.</li>
            <li>
              High-value items may require a signature on delivery or insured
              shipping.
            </li>
            <li>
              The exact carrier (UPS, FedEx, USPS, etc.) depends on the seller
              and destination.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Dispatch times</h2>
          <p>
            Sellers are expected to dispatch orders within{" "}
            <strong>2–3 business days</strong> of the order being placed, unless
            otherwise stated on the listing.
          </p>
        </section>

        <section className="card">
          <h2>Tracking and updates</h2>
          <p>
            Once your order ships, tracking details are added to your order and
            emailed to you. You can refer back to your order confirmation email
            at any time.
          </p>

          <div className="orders-cta">
            <Link href="/my-orders" className="btn-orders">
              View my orders &amp; tracking
            </Link>
            <p className="small">
              You’ll see live status updates for each purchase in your Famous
              Finds Shopping Bag.
            </p>
          </div>
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
        .orders-cta {
          margin-top: 12px;
        }
        .btn-orders {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: #ffffff;
          color: #000000;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
        .btn-orders:hover {
          background: #e5e5e5;
        }
        .small {
          font-size: 12px;
          color: #a1a1aa;
          margin-top: 8px;
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
