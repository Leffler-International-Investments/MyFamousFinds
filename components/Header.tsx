// FILE: /components/Header.tsx
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="site-header">
      <div className="inner">
        {/* Brand - Always top-left on mobile */}
        <Link href="/" className="brand">
          <Image
            src="/Famous-Finds-Logo.png"
            alt="Famous Finds Logo"
            width={46}
            height={50}
            priority
          />
        </Link>

        {/* Navigation - Below brand on mobile, left of admin on desktop */}
        <nav className="nav">
          <Link href="/" className="navLink">Dashboard</Link>
          <Link href="/help" className="navLink">Help</Link>
          <Link href="/about" className="navLink">About</Link>
          <Link href="/contact" className="navLink">Contact</Link>
        </nav>

        {/* Admin portals - Below nav on mobile, far right on desktop */}
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
          /* Ensure no default outer margins/paddings push it around */
          margin: 0;
          padding: 0;
        }
        .inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px; /* Slightly reduced overall vertical padding */
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; /* Allows items to wrap on smaller screens */
          gap: 20px; /* Space between logo/nav/admin on larger screens */
        }
        .brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
          flex-shrink: 0; /* Prevents logo from shrinking */
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 18px; /* Space between individual nav links on desktop */
          font-size: 13px;
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
          flex-wrap: wrap; /* Allows nav links to wrap horizontally */
          flex-grow: 1; /* Allows nav to take up available horizontal space */
          justify-content: flex-start; /* Aligns nav links to the left */
        }
        .navLink {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap; /* Prevents text from breaking */
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
        }
        .navLink:hover {
          color: #fff;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px; /* Space between admin buttons on desktop */
          flex-wrap: wrap; /* Allows admin buttons to wrap horizontally */
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
          justify-content: flex-end; /* Aligns admin buttons to the right on desktop */
          flex-shrink: 0; /* Prevents admin buttons block from shrinking too much */
        }
        .adminBtn {
          font-size: 12px;
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap; /* Prevents text from breaking */
          margin: 0; /* <--- Reset margins */
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

        /* --- Mobile-first approach: Define mobile layout first --- */

        /* Default for all screens (mobile) */
        @media (max-width: 850px) {
          .inner {
            flex-direction: column; /* Stack logo, nav, and admin vertically */
            align-items: flex-start; /* Align all stacked items to the left */
            padding: 8px 18px; /* Reduced vertical padding for the overall header */
            gap: 5px; /* <--- CRITICAL: Vertical space between Logo, Nav, and Admin sections when stacked */
          }
          .brand {
            width: 100%; /* Logo section takes full width */
            margin-bottom: 0; /* No bottom margin on mobile */
          }
          .nav {
            width: 100%; /* Nav section takes full width */
            margin-top: 5px; /* Small space above nav from logo */
            gap: 8px; /* <--- CRITICAL: Horizontal space between individual nav links on mobile */
          }
          .right {
            width: 100%; /* Admin section takes full width */
            margin-top: 5px; /* Small space above admin from nav */
            gap: 6px; /* <--- CRITICAL: Horizontal space between individual admin buttons on mobile */
          }
        }

        /* Adjustments for tablets/laptops and larger screens */
        @media (min-width: 851px) {
          .inner {
            flex-direction: row; /* Layout horizontally */
            justify-content: space-between; /* Spread items across */
            gap: 20px; /* Space between logo, nav, and admin */
          }
          .nav {
            flex-grow: 1; /* Nav takes available space */
            justify-content: flex-start; /* Nav links start from left */
            gap: 18px; /* Larger gap between nav links */
            margin-top: 0; /* Reset mobile margin */
          }
          .right {
            justify-content: flex-end; /* Admin buttons to the far right */
            gap: 10px; /* Larger gap between admin buttons */
            margin-top: 0; /* Reset mobile margin */
          }
        }

        /* Further refinement for very small screens if necessary */
        @media (max-width: 480px) {
          .nav {
            gap: 6px; /* Even smaller gap for nav on very small screens */
            font-size: 12px; /* Slightly smaller font size for nav links */
          }
          .adminBtn {
            font-size: 11px; /* Slightly smaller font for buttons if they are too wide */
            padding: 4px 8px; /* Smaller padding for buttons */
          }
        }
      `}</style>
    </header>
  );
}
