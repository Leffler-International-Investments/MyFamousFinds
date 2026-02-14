// FILE: /pages/terms.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="page">
      <Head>
        <title>Terms &amp; Conditions – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <h1>Terms &amp; Conditions</h1>
        <p className="intro">
          Please read these terms and conditions carefully before using the
          Famous Finds platform.
        </p>

        <div className="card">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Famous Finds website and services, you
            agree to be bound by these Terms &amp; Conditions. If you do not agree
            with any part of these terms, you may not use our services.
          </p>
        </div>

        <div className="card">
          <h2>2. Use of the Platform</h2>
          <p>
            Famous Finds provides a curated marketplace for authenticated,
            pre-loved luxury items. You must be at least 18 years old to use our
            services. You are responsible for maintaining the confidentiality of
            your account and for all activities that occur under your account.
          </p>
        </div>

        <div className="card">
          <h2>3. Purchases &amp; Payments</h2>
          <p>
            All prices are listed in the currency displayed at checkout. Payment
            is processed securely through our payment provider. By completing a
            purchase, you agree to pay the full amount including any applicable
            taxes and shipping fees.
          </p>
        </div>

        <div className="card">
          <h2>4. Authenticity &amp; Descriptions</h2>
          <p>
            We take authenticity seriously. All items are reviewed before being
            listed. However, Famous Finds acts as a marketplace and does not
            take ownership of items sold by third-party sellers. If you believe
            an item is not as described, please contact our support team.
          </p>
        </div>

        <div className="card">
          <h2>5. Returns &amp; Refunds</h2>
          <p>
            Returns may be accepted if an item is not as described, damaged, or
            fails authenticity verification. Please refer to our{" "}
            <a href="/returns">Returns Policy</a> for full details on
            eligibility and process.
          </p>
        </div>

        <div className="card">
          <h2>6. Intellectual Property</h2>
          <p>
            All content on the Famous Finds platform, including text, images,
            logos and design, is the property of Famous Finds or its licensors
            and is protected by intellectual property laws. You may not
            reproduce, distribute or create derivative works without prior
            written consent.
          </p>
        </div>

        <div className="card">
          <h2>7. Limitation of Liability</h2>
          <p>
            Famous Finds shall not be liable for any indirect, incidental or
            consequential damages arising from your use of the platform. Our
            total liability is limited to the amount you paid for the
            transaction in question.
          </p>
        </div>

        <div className="card">
          <h2>8. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms &amp; Conditions at any
            time. Changes will be posted on this page. Continued use of the
            platform after changes constitutes acceptance of the revised terms.
          </p>
        </div>

        <div className="card">
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms &amp; Conditions, please
            visit our <a href="/contact">Contact</a> page or reach out to our
            support team.
          </p>
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
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 16px;
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
        .card a {
          color: #2563eb;
          text-decoration: underline;
        }
        .card a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
