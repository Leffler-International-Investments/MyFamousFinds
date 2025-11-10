// FILE: /components/Header.tsx
// --- UPDATED per your new instructions ---

import Link from "next/link";
import Image from "next/image";
// --- ADDED (Change 1a) ---
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient"; // Assuming this path is correct

export default function Header() {
  // --- ADDED (Change 1b) ---
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setVipUser(user);
    });
    return () => unsubscribe();
  }, []);
  // -------------------------

  return (
    <header className="site-header">
      <div className="inner-container">
        {/* Brand */}
        <Link href="/" className="brand-logo">
          <Image
            src="/Famous-Finds-Logo.png"
            alt="Famous Finds Logo"
            width={95}
            height={80}
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="main-nav">
          <Link href="/" className="nav-link-item">Dashboard</Link>
          <Link href="/help" className="nav-link-item">Help</Link>
          <Link href="/about" className="nav-link-item">About</Link>
          <Link href="/contact" className="nav-link-item">Contact</Link>

          {/* --- ADDED (Change 1c) --- */}
          {/* VIP Club link (Famous-Finds Front Row) */}
          <Link
            href={vipUser ? "/club-profile" : "/club-login"}
            className="nav-link-item"
          >
            {vipUser ? "My VIP Profile" : "VIP Sign In"}
          </Link>
          {/* ------------------------- */}
        </nav>

        {/* Admin portals - Classes remain, styles are now in globals.css */}
        <div className="admin-portals">
          <Link href="/management/login" className="admin-button management">
            Management Admin Login
          </Link>
          <Link href="/seller/login" className="admin-button seller">
            Seller Admin Login
          </Link>
        </div>
      </div>

      <style jsx>{`
        /* Reset any potential global spacing on these elements */
        .site-header, .inner-container, .brand-logo, .main-nav, .nav-link-item, .admin-portals {
          margin: 0;
          padding: 0;
          box-sizing: border-box; /* Crucial for consistent sizing */
        }
        
        .site-header {
          background: #000;
          border-bottom: 1px solid #111;
          color: #f9fafb;
          width: 100%; /* Ensure header takes full width */
        }

        .inner-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px; /* Consistent padding for header content */
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; /* Allow items to wrap when necessary */
          gap: 20px; /* Default gap for spacing between main elements on wider screens */
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0; /* Prevents logo from shrinking */
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 18px; /* Space between individual nav links on wider screens */
          font-size: 13px;
          flex-wrap: wrap;
          flex-grow: 1; /* Allow nav to take available horizontal space */
          justify-content: flex-start;
        }

        .nav-link-item {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap; /* Keep links on one line */
        }
        .nav-link-item:hover {
          color: #fff;
        }

        .admin-portals {
          display: flex;
          align-items: center;
          gap: 10px; /* Space between admin buttons on wider screens */
          flex-wrap: wrap;
          justify-content: flex-end; /* Align buttons to the right on wider screens */
          flex-shrink: 0; /* Prevents button block from shrinking too much */
        }
        
        /* --- STYLES FOR .admin-button, .management, .seller REMOVED --- */
        /* --- They are now correctly placed in globals.css --- */


        /* --- Mobile Layout (max-width: 850px) --- */
        @media (max-width: 850px) {
          .inner-container {
            flex-direction: column; /* Stack logo, nav, and admin vertically */
            align-items: flex-start; /* Align all stacked items to the left */
            padding: 8px 18px; /* Reduced vertical padding for the overall header */
            gap: 5px; /* <--- THIS IS THE PRIMARY VERTICAL GAP BETWEEN SECTIONS ON MOBILE */
          }

          .brand-logo,
          .main-nav,
          .admin-portals {
            width: 100%; /* All main sections take full width on mobile */
            margin-bottom: 0 !important; 
          }
          
          .brand-logo {
            margin-bottom: 5px !important; /* Small space below logo */
          }

          .main-nav {
            gap: 8px; /* <--- HORIZONTAL GAP BETWEEN NAV LINKS ON MOBILE */
            margin-top: 5px !important; /* Small space above nav section */
          }

          .admin-portals {
            gap: 6px; /* <--- HORIZONTAL GAP BETWEEN ADMIN BUTTONS ON MOBILE */
            margin-top: 5px !important; /* Small space above admin section */
          }
        }

        /* --- Very Small Mobile Layout (max-width: 480px) --- */
        @media (max-width: 480px) {
          .main-nav {
            gap: 6px; /* Even smaller gap for nav on very small screens */
            font-size: 12px; /* Slightly smaller font size for nav links */
          }
          
          /* The .admin-button styles for mobile were also removed */
          /* as they are now handled globally in globals.css */
        }
      `}</style>
    </header>
  );
}
