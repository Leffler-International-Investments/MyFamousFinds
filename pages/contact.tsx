// FILE: /pages/contact.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactPage() {
  return (
    <div className="page">
      <Head>
        <title>Contact – Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>Contact</h1>
        <p className="intro">
          Have a question about an order, listing, payout or policy? Reach out
          to our team using the details below.
        </p>

        <div className="card-grid">
          <section className="card">
            <h2>Email</h2>
            <p>
              General support:{" "}
              <a href="mailto:support@famous-finds.com">
                support@famous-finds.com
              </a>
            </p>
            <p>
              Brand &amp; IP:{" "}
              <a href="mailto:ip@famousfinds.com">ip@famousfinds.com</a>
            </p>
          </section>

          <section className="card">
            <h2>Response times</h2>
            <p>
              We aim to respond to all messages within 1–2 business days.
              During busy periods it may take a little longer, but we reply to
              every ticket.
            </p>
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
          font-family: "Georgia", serif;
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 18px;
        }
        .card-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
