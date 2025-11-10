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
            width={46}
            height={50}
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
          gap: 20px; /* Increased gap for larger screens to give space between main sections */
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
          /* flex-grow: 1; /* Removed flex-grow here to prevent over-expansion when space is limited */
          justify-content: flex-start;
          flex-wrap: wrap; /* Allow nav links to wrap if needed */
        }
        .navLink {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap;
        }
        .navLink:hover {
          color: #fff;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end; /* Align admin buttons to the end by default */
        }
        .adminBtn {
          font-size: 12px;
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
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

        /* --- Mobile-specific adjustments (more aggressive) --- */
        @media (max-width: 850px) {
          .inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px; /* Significantly reduced vertical gap between stacked sections */
            padding: 8px 18px; /* Reduced vertical padding */
          }
          .brand {
            width: 100%;
            margin-bottom: 0px; /* No extra margin below logo */
          }
          .nav {
            width: 100%;
            flex-direction: row;
            justify-content: flex-start;
            gap: 10px; /* Reduced gap between nav links */
            margin-top: 5px; /* Small gap above nav */
          }
          .right {
            width: 100%;
            justify-content: flex-start;
            gap: 6px; /* Reduced gap between admin buttons */
            margin-top: 5px; /* Small gap above admin buttons */
          }
        }

        /* Further refinement for very small screens if necessary */
        @media (max-width: 480px) {
          .nav {
            gap: 8px; /* Even smaller gap for nav on very small screens */
          }
          .adminBtn {
            font-size: 11px; /* Slightly smaller font for buttons if they are too wide */
            padding: 5px 10px; /* Smaller padding for buttons */
          }
        }
      `}</style>
    </header>
  );
}
