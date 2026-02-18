// FILE: /pages/buying.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BuyingPage() {
  return (
    <div className="page">
      <Head>
        <title>Buying on Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">&larr; Help Center</a>

        <h1>Buying on Famous Finds</h1>
        <p className="intro">
          Everything you need to know before placing an order.
        </p>

        <div className="card">
          <h2>1. Browsing &amp; Search</h2>
          <p>
            Browse by category, designer, or use the search bar to find exactly
            what you&apos;re looking for. Filter results by price range, condition,
            and brand to narrow down your options. New arrivals are added daily,
            so check back often to discover the latest pieces.
          </p>
        </div>

        <div className="card">
          <h2>2. Item Condition</h2>
          <p>Items on Famous Finds are graded using the following scale:</p>
          <ul>
            <li>
              <strong>New with tags</strong> &mdash; Brand new, unworn, with
              original tags still attached.
            </li>
            <li>
              <strong>Excellent</strong> &mdash; Minimal signs of wear; the item
              is in near-new condition.
            </li>
            <li>
              <strong>Very Good</strong> &mdash; Light wear that is only visible
              on close inspection.
            </li>
            <li>
              <strong>Good</strong> &mdash; Visible wear consistent with regular
              use.
            </li>
          </ul>
          <p>
            All condition details are fully disclosed in the listing so you can
            buy with confidence.
          </p>
        </div>

        <div className="card">
          <h2>3. Making a Purchase</h2>
          <p>
            Add items to your shopping bag and complete checkout with your
            shipping details. Payments are processed securely via PayPal.
            You&apos;ll receive an email confirmation with your order details as
            soon as the purchase is complete.
          </p>
        </div>

        <div className="card">
          <h2>4. Making an Offer</h2>
          <p>
            You may submit an offer on eligible listings. Sellers can accept,
            counter, or decline your offer. Offers expire after 48 hours if
            the seller does not respond.
          </p>
        </div>

        <div className="card">
          <h2>5. Authenticity Guarantee</h2>
          <p>
            All listings are reviewed before going live on the platform. Famous
            Finds checks photos, descriptions, and brand accuracy to help
            ensure the integrity of every item listed. If you receive an item
            you believe is not authentic, contact us within 72 hours of
            delivery for assistance.
          </p>
        </div>

        <div className="card">
          <h2>6. After Your Purchase</h2>
          <p>
            Track your order in the <strong>My Orders</strong> section of your
            account. The seller is required to ship within 7 days of the sale.
            Tracking details will appear once the seller uploads them. Be sure
            to inspect your item carefully upon arrival.
          </p>
        </div>

        <div className="card">
          <h2>7. Buyer Protection</h2>
          <p>
            Your payment is held securely until you confirm receipt of the
            item. After delivery you have a 72-hour inspection window to
            review the item. If the item is materially different from the
            listing description, you are eligible for a full refund.
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
          color: #6b7280;
        }
        h1 {
          margin-top: 12px;
          font-family: Georgia, serif;
          font-size: 26px;
        }
        .intro {
          margin-bottom: 18px;
          color: #4b5563;
        }
        .card {
          background: white;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .card ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .card li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
