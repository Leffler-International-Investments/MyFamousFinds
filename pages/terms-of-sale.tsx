// FILE: /pages/terms-of-sale.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsOfSalePage() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Terms of Sale – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Terms of Sale</h1>
        <p className="updated">Last updated: 1 March 2026</p>

        <h2>1. Introduction</h2>
        <p>
          These Terms of Sale apply to all purchases and sales of items on the
          Famous Finds platform. By listing or purchasing an item, you agree to be
          bound by these Terms in addition to any other policies referenced on our
          site.
        </p>

        <h2>2. Authenticity and Seller Responsibility</h2>
        <p>
          By listing an item on Famous Finds, you <strong>warrant</strong> that the
          item is 100% genuine and accurately described. You confirm that:
        </p>
        <ul>
          <li>
            The item is not counterfeit, fake, imitation, or an “inspired by”
            version of any brand.
          </li>
          <li>
            You have full legal right to sell it and can provide proof of purchase
            or authenticity if requested.
          </li>
        </ul>
        <p>
          If any claim, dispute, or lawsuit arises concerning the authenticity or
          legality of a listed item, the <strong>seller alone</strong> bears full
          legal and financial responsibility. Famous Finds acts solely as a
          marketplace platform and is <strong>not the seller of record</strong>.
        </p>
        <p>
          Sellers agree to <strong>indemnify and hold harmless</strong> Famous
          Finds, its owners, and affiliates from any claim, loss, or damage
          arising from the sale of counterfeit or misrepresented goods.
        </p>

        <h2>3. Commission &amp; Fees</h2>
        <p>
          Famous Finds may charge a commission or service fee on completed sales.
          The applicable fee and any taxes or charges will be disclosed to the
          seller at the time of listing approval or payout.
        </p>

        <h2>4. Payment Processing</h2>
        <p>
          Payments on Famous Finds are processed by our third-party payment
          providers. By completing a transaction, buyers and sellers authorize the
          relevant payment provider to charge, hold, and disburse funds in
          accordance with our policies and applicable law.
        </p>

        <h2>5. Disputes &amp; Chargebacks</h2>
        <p>
          In the event of a dispute, we may temporarily hold funds while we review
          the issue. Sellers are required to cooperate fully and provide any
          requested documentation, including proof of authenticity and shipping
          evidence.
        </p>

        <h2>6. Changes to These Terms</h2>
        <p>
          We may update these Terms of Sale from time to time. If material changes
          are made, we will notify users by updating the “Last updated” date above
          and, in some cases, by additional notice.
        </p>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 4px;
        }
        .updated {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        h2 {
          font-size: 18px;
          margin-top: 24px;
          margin-bottom: 6px;
        }
        p,
        li {
          font-size: 14px;
          color: #e5e7eb;
          line-height: 1.6;
          margin-top: 6px;
        }
        ul {
          padding-left: 18px;
          list-style: disc;
        }
        strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
