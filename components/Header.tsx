// FILE: /components/Header.tsx

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setVipUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="site-header">
      <div className="inner-container">
        {/* Brand logo */}
        <Link href="/" className="brand-logo">
          <Image
            src="/Famous-Finds-Logo.png"
            alt="Famous Finds Logo"
            width={95}
            height={80}
            priority
          />
        </Link>

        {/* VIP button */}
        <div className="vip-link-area">
          <Link
            href={vipUser ? "/club-profile" : "/vip-welcome"}
            className="admin-button vip"
          >
            {vipUser ? "My VIP Profile" : "VIP Front Row"}
          </Link>
        </div>

        {/* FF Shopping Bag – always visible, links to customer orders */}
        <div className="bag-link-area">
          <Link href="/my-orders" className="shopping-bag-link">
            🛍 FF Shopping Bag
          </Link>
        </div>

        {/* Main nav */}
        <nav className="main-nav">
          <Link href="/" className="nav-link-item">
            Dashboard
          </Link>
          <Link href="/help" className="nav-link-item">
            Help
          </Link>
          <Link href="/about" className="nav-link-item">
            About
          </Link>
          <Link href="/contact" className="nav-link-item">
            Contact
          </Link>
        </nav>

        {/* Admin portals */}
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
        .site-header,
        .inner-container,
        .brand-logo,
        .main-nav,
        .nav-link-item,
        .admin-portals,
        .vip-link-area,
        .bag-link-area {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .site-header {
          background: #000;
          border-bottom: 1px solid #111;
          color: #f9fafb;
          width: 100%;
        }

        .inner-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .vip-link-area,
        .bag-link-area {
          flex-shrink: 0;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 13px;
          flex-wrap: wrap;
          flex-grow: 1;
          justify-content: flex-start;
        }

        .nav-link-item {
          color: #e5e7eb;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-link-item:hover {
          color: #fff;
        }

        .admin-portals {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .shopping-bag-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #4b5563;
          background: #111827;
          color: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .shopping-bag-link:hover {
          background: #f9fafb;
          color: #111827;
          border-color: #f9fafb;
        }

        @media (max-width: 850px) {
          .inner-container {
            flex-direction: column;
            align-items: flex-start;
            padding: 8px 18px;
            gap: 5px;
          }

          .brand-logo,
          .vip-link-area,
          .bag-link-area,
          .main-nav,
          .admin-portals {
            width: 100%;
            margin-bottom: 0 !important;
          }

          .brand-logo {
            margin-bottom: 5px !important;
          }

          .vip-link-area,
          .bag-link-area {
            margin-top: 5px !important;
          }

          .main-nav {
            gap: 8px;
            margin-top: 5px !important;
          }

          .admin-portals {
            gap: 6px;
            margin-top: 5px !important;
          }
        }

        @media (max-width: 480px) {
          .main-nav {
            gap: 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
}
