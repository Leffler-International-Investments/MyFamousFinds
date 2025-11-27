// FILE: /pages/privacy.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="page">
      <Head>
        <title>Privacy Policy – Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>Privacy Policy</h1>
        <p className="intro">
          This summary explains how Famous Finds collects, uses and protects
          your personal information when you use our services.
        </p>

        <div className="card-grid">
          <section className="card">
            <h2>What we collect</h2>
            <p>
              We collect account details, contact information, order history and
              limited device data to operate the marketplace and keep it secure.
            </p>
          </section>

          <section className="card">
            <h2>How we use it</h2>
            <p>
              Data is used to process orders, communicate with you, prevent
              fraud and improve the Famous Finds experience.
            </p>
          </section>

          <section className="card">
            <h2>Sharing</h2>
            <p>
              We only share data with service providers involved in payments,
              shipping, analytics and security — never to sell your personal
              information.
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
