// FILE: /pages/selling.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellingPage() {
  return (
    <div className="page">
      <Head>
        <title>Selling on Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">&larr; Help Center</a>

        <h1>Selling on Famous Finds</h1>
        <p className="intro">
          Everything you need to know about listing items, shipping orders, and getting paid as a seller on Famous Finds.
        </p>

        <div className="card">
          <h2>1. Getting Started</h2>
          <p>
            Apply to become a seller on Famous Finds. Complete your seller profile
            with business details. Once approved, access your Seller Dashboard to
            manage listings.
          </p>
        </div>

        <div className="card">
          <h2>2. Creating a Listing</h2>
          <ul>
            <li>Upload high-quality photos (minimum 3, showing front, back, and details).</li>
            <li>Write an accurate title and description.</li>
            <li>Select the correct category, designer, and condition.</li>
            <li>Set your price &mdash; you control your pricing.</li>
          </ul>
        </div>

        <div className="card">
          <h2>3. Review &amp; Approval</h2>
          <p>
            Every listing is reviewed by Famous Finds before going live. We check
            photo quality, description accuracy, and brand compliance. Listings that
            don&rsquo;t meet our standards will be returned with feedback.
          </p>
        </div>

        <div className="card">
          <h2>4. When Your Item Sells</h2>
          <ul>
            <li>You&rsquo;ll receive an email notification immediately.</li>
            <li>View the order details in your Seller Dashboard.</li>
            <li>Ship within 7 calendar days of the sale.</li>
          </ul>
        </div>

        <div className="card">
          <h2>5. Shipping Your Item</h2>
          <ul>
            <li>Pack items securely with appropriate protective materials.</li>
            <li>Include any accessories, dust bags, or authentication cards as described.</li>
            <li>Ship with a tracked service and upload the tracking number to your dashboard.</li>
          </ul>
        </div>

        <div className="card">
          <h2>6. Getting Paid</h2>
          <ul>
            <li><strong>Commission:</strong> Famous Finds deducts up to 25% commission plus 3% processing fee.</li>
            <li><strong>Payouts</strong> are processed via PayPal after buyer confirmation.</li>
            <li><strong>Typical processing time:</strong> 3&ndash;Payouts on 15th of each month, minimum 7 days from reciept of item.</li>
          </ul>
        </div>

        <div className="card">
          <h2>7. Seller Standards</h2>
          <ul>
            <li>Maintain accurate descriptions.</li>
            <li>Ship on time.</li>
            <li>Respond to buyer queries promptly.</li>
            <li>Consistent quality builds your seller reputation.</li>
          </ul>
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
        .back-link {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        h1 {
          margin: 12px 0;
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
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
          color: #374151;
          line-height: 1.7;
        }
        .card li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
