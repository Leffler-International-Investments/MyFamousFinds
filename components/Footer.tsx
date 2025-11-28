// FILE: /components/Footer.tsx

import Link from "next/link";
import HomepageButler from "./HomepageButler";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="ff-footer">
        <div className="ff-footer-inner">
          {/* Brand + copyright */}
          <div className="ff-footer-brand">
            <div className="ff-footer-title">FAMOUS FINDS</div>
            <div className="ff-footer-copy">
              © {year} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* Links */}
          <nav className="ff-footer-links">
            <Link href="/buying" className="ff-footer-link">
              Authenticity
            </Link>
            <Link href="/privacy" className="ff-footer-link">
              Privacy
            </Link>
          </nav>
        </div>

        <style jsx>{`
          .ff-footer {
            margin-top: auto;
            border-top: 1px solid #111827;
            background: #020617;
            color: #f9fafb;
          }

          .ff-footer-inner {
            max-width: 960px;
            margin: 0 auto;
            padding: 18px 16px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .ff-footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .ff-footer-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.25em;
            text-transform: uppercase;
          }

          .ff-footer-copy {
            font-size: 11px;
            color: #9ca3af;
          }

          .ff-footer-links {
            margin-top: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
            column-gap: 64px; /* big visible gap between links */
          }

          .ff-footer-link {
            font-size: 13px;
            color: #60a5fa; /* blue */
            text-decoration: none;
          }

          .ff-footer-link:hover {
            color: #93c5fd; /* lighter blue on hover */
            text-decoration: underline;
          }

          @media (max-width: 480px) {
            .ff-footer-links {
              column-gap: 40px;
            }
          }
        `}</style>
      </footer>

      {/* Keep the floating butler as is */}
      <div className="butler-floating">
        <HomepageButler />
      </div>
    </>
  );
}
