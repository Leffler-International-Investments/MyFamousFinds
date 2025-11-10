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

        {/* Wrapper for Navigation and Admin portals for better control on mobile */}
        <div className="nav-and-admin-wrapper">
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
          padding: 12px 18px; /* Default padding for header container */
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; /* Allows sections to wrap */
          gap: 20px; /* Space between logo and the nav-and-admin-wrapper on larger screens */
        }
        .brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          /* Explicitly reset margins/paddings if any were inherited */
          margin: 0; 
          padding: 0;
        }

        /* New wrapper for navigation and admin portals */
        .nav-and-admin-wrapper {
          display: flex;
          align-items: center;
          gap: 20px; /* Space between nav and admin on larger screens */
          flex-wrap: wrap; /* Allows nav and admin to wrap relative to each other */
          margin: 0;
          padding: 0;
          flex-grow: 1; /* Allows this wrapper to take available space */
          justify-content: flex-end; /* Pushes content to the right on larger screens */
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 18px; /* Space between individual nav links */
          font-size: 13px;
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
          flex-wrap: wrap;
        }
        .navLink {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap;
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
        }
        .navLink:hover {
          color: #fff;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px; /* Space between admin buttons */
          flex-wrap: wrap;
          margin: 0; /* <--- Reset margins */
          padding: 0; /* <--- Reset padding */
          justify-content: flex-end; /* Aligns buttons to the right */
        }
        .adminBtn {
          font-size: 12px;
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          margin: 0; /* <--- Reset margins */
          /* No padding reset here, as padding is intentional for button size */
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

        /* --- Mobile-specific adjustments --- */
        @media (max-width: 850px) {
          .inner {
            flex-direction: column; /* Stacks sections vertically */
            align-items: flex-start; /* Aligns sections to the left */
            gap: 5px; /* <--- CRITICAL: Vertical space between Logo and Nav/Admin Wrapper */
            padding: 8px 18px; /* Reduced vertical padding for the overall header */
          }
          .brand {
            width: 100%; /* Logo takes full width */
            margin-bottom: 0px; /* Ensure no bottom margin pushes content down */
          }
          .nav-and-admin-wrapper {
            width: 100%; /* Wrapper takes full width */
            flex-direction: column; /* Nav and Admin stack vertically */
            align-items: flex-start; /* Nav and Admin align to the left */
            gap: 5px; /* <--- CRITICAL: Vertical space between Nav and Admin sections */
            margin-top: 5px; /* Small space above this wrapper from the logo */
          }
          .nav {
            width: 100%; /* Nav section takes full width */
            justify-content: flex-start;
            gap: 8px; /* <--- CRITICAL: Horizontal space between individual nav links */
            margin-top: 0; /* Ensure no top margin */
          }
          .right {
            width: 100%; /* Admin section takes full width */
            justify-content: flex-start;
            gap: 6px; /* <--- CRITICAL: Horizontal space between individual admin buttons */
            margin-top: 0; /* Ensure no top margin */
          }
        }

        /* Further refinement for very small screens if necessary */
        @media (max-width: 480px) {
          .nav {
            gap: 6px; /* Even smaller gap for nav on very small screens */
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
