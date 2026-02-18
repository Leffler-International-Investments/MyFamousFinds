// FILE: /pages/returns.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ReturnsPage() {
  return (
    <div className="page">
      <Head>
        <title>Returns &amp; Refunds &ndash; Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">&larr; Help Center</a>

        <h1>Returns &amp; Refunds</h1>
        <p className="intro">
          Our complete policy on returns, refunds, and how we resolve issues fairly for buyers and sellers.
        </p>

        <div className="card">
          <h2>1. Our Approach</h2>
          <p>
            We want every buyer to be happy with their purchase. Famous Finds acts
            as a trusted intermediary to resolve issues fairly for both buyers and
            sellers.
          </p>
        </div>

        <div className="card">
          <h2>2. When Returns Apply</h2>
          <ul>
            <li>Item significantly not as described (wrong size, colour, or material).</li>
            <li>Item arrived damaged during shipping.</li>
            <li>Authenticity concerns.</li>
            <li>Missing accessories or parts that were listed as included.</li>
          </ul>
        </div>

        <div className="card">
          <h2>3. When Returns Do Not Apply</h2>
          <ul>
            <li>Change of mind after purchase.</li>
            <li>Minor variations in colour due to photography/screen differences.</li>
            <li>Normal signs of wear consistent with the listed condition grade.</li>
            <li>Items accurately described as having defects.</li>
          </ul>
        </div>

        <div className="card">
          <h2>4. How to Request a Return</h2>
          <ul>
            <li>Contact Famous Finds support within 72 hours of receiving your item.</li>
            <li>Provide clear photographs showing the issue.</li>
            <li>Describe how the item differs from the listing.</li>
            <li>Do not ship the item back until instructed.</li>
          </ul>
        </div>

        <div className="card">
          <h2>5. The Resolution Process</h2>
          <ul>
            <li>Famous Finds reviews the claim within 2 business days.</li>
            <li>We may request additional evidence from both parties.</li>
            <li>Possible outcomes: full refund, partial refund, or claim declined.</li>
            <li>If approved, we provide return shipping instructions.</li>
          </ul>
        </div>

        <div className="card">
          <h2>6. Refund Processing</h2>
          <ul>
            <li>Refunds are processed to the original payment method.</li>
            <li>Processing time: 5&ndash;10 business days after the return is approved.</li>
            <li>Shipping costs may or may not be refunded depending on the circumstances.</li>
          </ul>
        </div>

        <div className="card">
          <h2>7. Disputes</h2>
          <p>
            If you disagree with a resolution, you may request a review. Email{" "}
            <a href="mailto:support@myfamousfinds.com">support@myfamousfinds.com</a>{" "}
            with your order ID and details.
          </p>
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
          font-family: Georgia, serif;
          font-size: 26px;
          margin: 12px 0;
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
        .card a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
