// FILE: /pages/privacy.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Privacy policy – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Privacy policy</h1>
        <p className="intro">
          This page explains how Famous Finds collects, uses and protects your
          information when you use our marketplace.
        </p>

        <section className="card">
          <h2>What we collect</h2>
          <ul>
            <li>Account details you provide (name, email, password).</li>
            <li>
              Seller details such as payout information and verification docs.
            </li>
            <li>Order information, messages, and support history.</li>
          </ul>
        </section>

        <section className="card">
          <h2>How we use your data</h2>
          <ul>
            <li>To operate the marketplace and fulfil orders.</li>
            <li>To prevent fraud and keep buyers and sellers safe.</li>
            <li>To contact you about your account, orders or policy updates.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Third-party services</h2>
          <p>
            We use trusted providers such as payment processors, analytics and
            cloud hosting. They only receive the data needed to provide their
            services and are bound by appropriate agreements.
          </p>
        </section>

        <section className="card">
          <h2>Your rights</h2>
          <p>
            You can request access to, correction of, or deletion of your
            personal data, subject to legal and fraud-prevention obligations.
            Email{" "}
            <a href="mailto:privacy@famous-finds.com">
              privacy@famous-finds.com
            </a>{" "}
            to make a request.
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
        ul {
          padding-left: 18px;
          margin: 6px 0 0;
        }
        li {
          margin-bottom: 4px;
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
