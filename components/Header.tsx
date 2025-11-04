// FILE: /components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="brand">
          <span className="logo">F</span>
          <span className="wordmark">FAMOUS FINDS</span>
        </Link>

        <nav className="nav">
          <Link href="/" className="navLink">
            Dashboard
          </Link>
          <Link href="/sell" className="navLink">
            Sell
          </Link>
          <Link href="/help" className="navLink">
            Help
          </Link>
          <Link href="/about" className="navLink">
            About
          </Link>
          <Link href="/contact" className="navLink">
            Contact
          </Link>
        </nav>

        <div className="right">
          {/* Single small entry point into the “under the hood” admin area */}
          <Link href="/admin" className="navLink adminLink">
            Admin
          </Link>
        </div>
      </div>

      <style jsx>{`
        .site-header {
          border-bottom: 1px solid #111;
          background: #000;
          color: #f9fafb;
        }
        .inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #f9fafb;
          color: #000;
          font-size: 14px;
        }
        .wordmark {
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .nav {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
        }
        .navLink {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap;
        }
        .navLink:hover {
          color: #ffffff;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }
        .adminLink {
          opacity: 0.8;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #1f2937;
        }
        .adminLink:hover {
          opacity: 1;
          border-color: #4b5563;
        }
        @media (max-width: 768px) {
          .inner {
            flex-wrap: wrap;
            align-items: flex-start;
          }
          .nav {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            row-gap: 6px;
          }
          .right {
            margin-left: auto;
          }
        }
      `}</style>
    </header>
  );
}
