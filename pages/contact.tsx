// FILE: /pages/contact.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactPage() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Contact us – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Contact us</h1>
        <p className="intro">
          Questions about an order, a listing or your account? Reach out and
          we&apos;ll get back to you as soon as we can.
        </p>

        <section className="card">
          <h2>Support email</h2>
          <p>
            Email{" "}
            <a href="mailto:support@famous-finds.com">
              support@famous-finds.com
            </a>{" "}
            with your order number or listing ID and a short description of
            what you need help with.
          </p>

          <h3>Typical response time</h3>
          <p>Within 1–2 business days for most enquiries.</p>
        </section>

        <section className="card">
          <h2>Seller enquiries</h2>
          <p>
            For questions about selling, verification, bulk upload or payouts,
            email{" "}
            <a href="mailto:sellers@famous-finds.com">
              sellers@famous-finds.com
            </a>
            .
          </p>
        </section>

        <section className="card">
          <h2>Press &amp; partnerships</h2>
          <p>
            For media or partnership opportunities, contact{" "}
            <a href="mailto:press@famous-finds.com">
              press@famous-finds.com
            </a>
            .
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
          margin-bottom: 24px;
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
        .card h3 {
          font-size: 13px;
          margin-top: 14px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a1a1aa;
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
