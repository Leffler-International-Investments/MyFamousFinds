// FILE: /pages/authenticity-policy.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AuthenticityPolicy() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Authenticity &amp; Counterfeit Policy – Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>Authenticity &amp; Counterfeit Policy</h1>
        <p>
          Famous Finds is committed to maintaining a trusted marketplace for luxury
          and designer goods. We strictly prohibit counterfeit, fake, or
          misrepresented items of any kind.
        </p>

        <h2>For Sellers</h2>
        <ul>
          <li>You must sell only genuine, authentic products.</li>
          <li>You must provide proof of authenticity on request.</li>
          <li>You are fully liable for any claim related to authenticity.</li>
        </ul>

        <h2>For Buyers</h2>
        <p>
          Famous Finds reviews listings but cannot guarantee the authenticity of
          each individual item. If you suspect a counterfeit, contact us immediately
          at{" "}
          <a href="mailto:ip@famousfinds.com" className="link">
            ip@famousfinds.com
          </a>
          .
        </p>

        <h2>Brand &amp; IP Complaints</h2>
        <p>
          Rights-holders can report infringing listings through the same email.
          Verified claims will result in immediate suspension and investigation of
          the relevant listing and seller.
        </p>
      </main>
      <Footer />
      <style jsx>{`
        .wrap {
          max-width: 800px;
          margin: 32px auto 40px;
          padding: 0 16px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 20px;
          margin-top: 20px;
        }
        p,
        li {
          color: #e5e7eb;
          margin-top: 8px;
          font-size: 14px;
        }
        ul {
          padding-left: 18px;
          list-style: disc;
        }
        .link {
          color: #60a5fa;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
