// FILE: /pages/management/support.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ManagementSupport() {
  return (
    <div className="dashboard-page">
      <Head>
        <title>Support – Management Console | Famous Finds</title>
      </Head>

      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Support</h1>
            <p>
              Internal support hub for the Famous Finds management team. Use
              this page to find the right place to raise issues, request help,
              or report urgent problems.
            </p>
          </div>
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <section className="support-card">
          <h2>Operational issues</h2>
          <p>
            For issues affecting live orders, payments, or vetting decisions,
            please log a case so it can be tracked and prioritised.
          </p>
          <ul>
            <li>Order or payment cannot be updated</li>
            <li>Vetting decision needs manual review</li>
            <li>Dispute between buyer and seller</li>
          </ul>
          <p className="support-note">
            Email:{" "}
            <a href="mailto:ops@famous-finds.com">ops@famous-finds.com</a>
          </p>
        </section>

        <section className="support-card">
          <h2>Technical problems</h2>
          <p>
            If something in the Seller Console, Management Console, or
            storefront appears broken, collect as much detail as you can:
          </p>
          <ul>
            <li>Screenshot of the issue</li>
            <li>URL of the page</li>
            <li>What you were trying to do</li>
            <li>Time the issue occurred</li>
          </ul>
          <p className="support-note">
            Email:{" "}
            <a href="mailto:tech@famous-finds.com">tech@famous-finds.com</a>
          </p>
        </section>

        <section className="support-card">
          <h2>Seller / buyer support</h2>
          <p>
            For questions from sellers or buyers that you can&apos;t resolve
            directly, forward the conversation to the customer support queue.
          </p>
          <p className="support-note">
            Email:{" "}
            <a href="mailto:support@famous-finds.com">
              support@famous-finds.com
            </a>
          </p>
          <p className="support-note">
            Public-facing help content is available on the{" "}
            <Link href="/help">Help Center</Link> and{" "}
            <Link href="/contact">Contact</Link> pages.
          </p>
        </section>

        <section className="support-card">
          <h2>Emergency / security</h2>
          <p>
            If you suspect fraud, account takeover, or any security issue,
            escalate immediately.
          </p>
          <ul>
            <li>Freeze the affected account(s) where possible</li>
            <li>Capture screenshots and any relevant IDs (order, user, listing)</li>
            <li>Notify the security / tech contact</li>
          </ul>
          <p className="support-note">
            Email:{" "}
            <a href="mailto:security@famous-finds.com">
              security@famous-finds.com
            </a>
          </p>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #020617;
          color: #f9fafb;
          display: flex;
          flex-direction: column;
        }

        .dashboard-main {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 16px 80px;
          width: 100%;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }

        .dashboard-header h1 {
          font-size: 26px;
          margin-bottom: 4px;
        }

        .dashboard-header p {
          font-size: 14px;
          color: #d4d4d8;
          max-width: 520px;
        }

        .dashboard-header a {
          font-size: 13px;
          color: #a1a1aa;
          text-decoration: none;
          white-space: nowrap;
        }

        .dashboard-header a:hover {
          color: #e5e5e5;
        }

        .support-card {
          border-radius: 16px;
          border: 1px solid #27272a;
          background: #020617;
          padding: 16px 18px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #e5e5e5;
        }

        .support-card h2 {
          font-size: 16px;
          margin-bottom: 6px;
        }

        .support-card p {
          margin-bottom: 6px;
        }

        .support-card ul {
          margin: 6px 0 0;
          padding-left: 18px;
          list-style: disc;
          color: #d4d4d4;
        }

        .support-card li + li {
          margin-top: 4px;
        }

        .support-note {
          margin-top: 8px;
          font-size: 13px;
          color: #a1a1aa;
        }

        a {
          color: #a5b4fc;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
