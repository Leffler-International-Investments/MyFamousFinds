// FILE: /components/Header.tsx
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="site-header">
      <div className="inner">
        {/* Brand */}
        <Link href="/" className="brand">
          <Image
            src="/Famous-Finds-Logo.png"
            alt="Famous Finds Logo"
            width={80}
            height={95}
            priority
          />
        </Link>

        {/* Main navigation */}
        <nav className="nav">
          <Link href="/" className="navLink">Dashboard</Link>
          <Link href="/help" className="navLink">Help</Link>
          <Link href="/about" className="navLink">About</Link>
          <Link href="/contact" className="navLink">Contact</Link>
        </nav>

        {/* Admin portals */}
        <div className="right">
          <Link href="/management/login" className="adminBtn management">
            Management Admin Login
          </Link>
          <Link href="/seller/login" className="adminBtn seller">
            Seller Admin Login
          </Link>
        </div>
      </div>

      <style jsx>{`
        .site-header {
          background: #000;
          border-bottom: 1px solid #111;
          color: #f9fafb;
        }
        .inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }
        .nav {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 13px;
        }
        .navLink {
          color: #e5e7eb;
          text-decoration: none;
        }
        .navLink:hover {
          color: #fff;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .adminBtn {
          font-size: 12px;
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .management {
          background: linear-gradient(90deg, #d1d5db, #9ca3af);
          color: #000;
        }
        .seller {
          background: linear-gradient(90deg, #facc15, #f59e0b);
          color: #000;
        }
        .adminBtn:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }
        @media (max-width: 850px) {
          .inner {
            flex-direction: column;
            align-items: flex-start;
          }
          .nav {
            flex-wrap: wrap;
            gap: 10px;
          }
          .right {
            margin-top: 6px;
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </header>
  );
}
