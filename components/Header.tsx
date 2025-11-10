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
          gap: 20px; /* Responsible for space between main sections (logo, nav, admin buttons) on large screens */
          flex-wrap: wrap; /* Allows items to wrap if space is insufficient */
        }
        .brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          /* flex-shrink: 0; */ /* Ensure logo doesn't shrink */
        }
        .nav {
          display: flex;
          align-items: center;
          gap: 18px; /* Responsible for space between individual nav links */
          font-size: 13px;
          flex-grow: 1; /* Allows navigation to take up available space on larger screens */
          flex-basis: auto; /* Allow items to determine their own size */
          justify-content: flex-start;
          flex-wrap: wrap; /* Allow nav links to wrap individually */
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
          gap: 10px; /* Responsible for space between admin buttons */
          flex-wrap: wrap; /* Allows admin buttons to wrap */
          justify-content: flex-end; /* Align admin buttons to the end by default */
          flex-shrink: 0; /* Prevents admin buttons block from shrinking too much */
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

        /* --- Mobile-specific adjustments --- */
        @media (max-width: 850px) {
          .inner {
            flex-direction: column; /* Stacks logo, nav, and admin buttons vertically */
            align-items: flex-start; /* Aligns everything to the left */
            gap: 5px; /* <--- THIS LINE IS CRITICAL for vertical space between brand, nav, and admin sections */
            padding: 8px 18px; /* Reduced vertical padding for the header container */
          }
          .brand {
            width: 100%; /* Ensure logo block takes full width */
            margin-bottom: 0px; /* Removes extra space below logo */
          }
          .nav {
            width: 100%; /* Ensure nav block takes full width */
            justify-content: flex-start;
            gap: 8px; /* <--- THIS LINE IS CRITICAL for horizontal space between individual nav links */
            margin-top: 5px; /* Small space above nav section */
          }
          .right {
            width: 100%; /* Ensure admin buttons block takes full width */
            justify-content: flex-start; /* Aligns admin buttons to the left */
            gap: 6px; /* <--- THIS LINE IS CRITICAL for horizontal space between individual admin buttons */
            margin-top: 5px; /* Small space above admin buttons section */
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
