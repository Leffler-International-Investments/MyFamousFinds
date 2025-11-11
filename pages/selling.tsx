// FILE: /pages/selling.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellingInfo() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Selling on Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1>Selling guide</h1>
        <p className="intro">
          A quick overview of how to list items and get paid as a seller on
          Famous Finds.
        </p>

        <section className="card">
          <h2>1. Submit your item</h2>
          <p>
            Use the{" "}
            <Link href="/sell">
              Sell form
            </Link>{" "}
            to send us details and photos. Our team reviews every submission for
            brand, condition and fit with the marketplace.
          </p>
        </section>

        <section className="card">
          <h2>2. Approval &amp; listing</h2>
          <p>
            Once approved, we create a listing on Famous Finds. We may adjust
            the title, description or price to match our house standards and
            current market data.
          </p>
        </section>

        <section className="card">
          <h2>3. Shipping &amp; delivery</h2>
          <p>
            When an item sells, we&apos;ll send you a shipping label or
            instructions. You&apos;re expected to dispatch within the agreed
            time frame and upload tracking so the buyer can follow the delivery.
          </p>
        </section>

        <section className="card">
          <h2>4. Getting paid</h2>
          <p>
            Payouts are processed via Stripe Connect to your nominated bank
            account. You can track balances and payouts in your{" "}
            <Link href="/seller/wallet">Wallet</Link> and monthly{" "}
            <Link href="/seller/statements">Statements</Link>.
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
