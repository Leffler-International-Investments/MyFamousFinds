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
              &copy; {year} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* Main nav links (moved from header) */}
          <nav className="ff-footer-nav">
            <Link href="/my-orders" className="ff-footer-link">
              My Shopping Bag
            </Link>
            <Link href="/" className="ff-footer-link">
              Homepage
            </Link>
            <Link href="/help" className="ff-footer-link">
              Help
            </Link>
            <Link href="/about" className="ff-footer-link">
              About
            </Link>
            <Link href="/contact" className="ff-footer-link">
              Contact
            </Link>
          </nav>

          {/* Secondary links */}
          <nav className="ff-footer-links">
            <Link href="/buying" className="ff-footer-link">
              Authenticity
            </Link>
            <Link href="/privacy" className="ff-footer-link">
              Privacy
            </Link>
            <Link href="/management/login" className="ff-footer-link">
              Management Admin Login
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
            padding: 24px 16px 28px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
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

          .ff-footer-nav {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px 28px;
          }

          .ff-footer-nav .ff-footer-link {
            font-size: 13px;
            color: #f9fafb;
            font-weight: 500;
          }
          .ff-footer-nav .ff-footer-link:hover {
            color: #93c5fd;
          }

          .ff-footer-links {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px 48px;
          }

          .ff-footer-link {
            font-size: 13px;
            color: #60a5fa;
            text-decoration: none;
          }

          .ff-footer-link:hover {
            color: #93c5fd;
            text-decoration: underline;
          }

          @media (max-width: 480px) {
            .ff-footer-nav,
            .ff-footer-links {
              gap: 8px 20px;
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
