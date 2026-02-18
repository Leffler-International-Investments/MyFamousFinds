// FILE: /pages/shipping.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ShippingPage() {
  return (
    <div className="page">
      <Head>
        <title>Shipping &amp; Delivery &ndash; Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">&larr; Help Center</a>

        <h1>Shipping &amp; Delivery</h1>
        <p className="intro">
          Everything you need to know about shipping, tracking, and delivery.
        </p>

        <div className="card">
          <h2>1. How Shipping Works</h2>
          <p>
            Sellers ship directly to buyers. Shipping costs and methods are
            specified in each listing, so you know exactly what to expect
            before purchasing. Sellers are required to ship within 7 calendar
            days of the sale.
          </p>
        </div>

        <div className="card">
          <h2>2. Tracking Your Order</h2>
          <p>
            Once the item has been shipped, tracking details are uploaded by
            the seller. You can view tracking information in your{" "}
            <strong>My Orders</strong> page at any time. You&apos;ll also be
            notified when tracking is available.
          </p>
        </div>

        <div className="card">
          <h2>3. Delivery Times</h2>
          <ul>
            <li>
              <strong>Domestic orders</strong> &mdash; Typically 3&ndash;7
              business days.
            </li>
            <li>
              <strong>International orders</strong> &mdash; 7&ndash;21 business
              days depending on destination and customs processing.
            </li>
          </ul>
          <p>
            Delivery times are estimates and may vary based on the carrier,
            destination, and other factors outside our control.
          </p>
        </div>

        <div className="card">
          <h2>4. Packaging Requirements (for Sellers)</h2>
          <p>
            Items must be clean and properly packaged to ensure they arrive in
            the condition described. Use appropriate protective materials such
            as bubble wrap, tissue paper, or padded envelopes. Include any
            original dust bags, boxes, or authentication cards if they were
            listed as included with the item.
          </p>
        </div>

        <div className="card">
          <h2>5. Lost or Damaged Shipments</h2>
          <p>
            If your order hasn&apos;t arrived within the expected timeframe,
            contact the seller first to inquire about the shipment status. If
            the issue remains unresolved, contact Famous Finds support and
            we&apos;ll work with both parties to find a resolution.
          </p>
        </div>

        <div className="card">
          <h2>6. International Shipping</h2>
          <p>
            Import duties and taxes may apply to international orders. These
            charges are the responsibility of the buyer. Customs processing
            can add additional time to delivery estimates. Please ensure your
            delivery address is able to accept international parcels.
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
