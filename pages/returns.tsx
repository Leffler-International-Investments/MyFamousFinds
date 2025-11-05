// FILE: /pages/returns.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ReturnsPage() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Returns &amp; refunds – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Returns &amp; refunds</h1>
        <p className="intro">
          Because Famous Finds is a curated marketplace, each item is sold by an
          individual seller. This policy describes how returns and refunds are
          handled.
        </p>

        <section className="card">
          <h2>Change-of-mind returns</h2>
          <p>
            Unless explicitly stated on a listing, change-of-mind returns are
            not guaranteed. Many items are one-off or consigned pieces. Always
            review photos, description and sizing carefully before purchasing.
          </p>
        </section>

        <section className="card">
          <h2>Items not as described</h2>
          <p>
            If an item is significantly not as described (for example incorrect
            model, undisclosed damage, or counterfeit), contact support within
            48 hours of delivery. We may request photos or other documentation.
          </p>
          <p>
            Where a claim is approved, we&apos;ll coordinate a return with the
            seller or process a refund according to our buyer protection
            process.
          </p>
        </section>

        <section className="card">
          <h2>Damaged in transit</h2>
          <p>
            If a parcel arrives damaged, photograph the packaging and the item
            immediately and contact{" "}
            <a href="mailto:support@famous-finds.com">
              support@famous-finds.com
            </a>{" "}
            so we can help lodge a shipping claim.
          </p>
        </section>

        <section className="card">
          <h2>How refunds are paid</h2>
          <p>
            Approved refunds are processed back to the original payment method.
            Once we issue the refund, banks and card issuers can take 3–10
            business days to display it on your statement.
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
          margin-bottom: 10px;
        }
        .intro {
          font-size: 14px;
          color: #d4d4d4;
          margin-bottom: 18px;
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
        a {
          color: #a5b4fc;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
