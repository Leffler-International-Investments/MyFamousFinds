// FILE: /components/Header.tsx

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    // ✅ Guard: prevents client-side crash if auth is null/undefined at runtime
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (user) => setVipUser(user));
    return () => unsub();
  }, []);

  const categoryNav = [
    { label: "NEW ARRIVALS", href: "/category/new-arrivals" },
    { label: "CATALOGUE", href: "/catalogue" },
    { label: "DESIGNERS", href: "/designers" },
    { label: "WOMEN", href: "/category/women" },
    { label: "BAGS", href: "/category/bags" },
    { label: "MEN", href: "/category/men" },
    { label: "JEWELRY", href: "/category/jewelry" },
    { label: "WATCHES", href: "/category/watches" },
  ];

  return (
    <header className="ff-header">
      {/* TOP BAR */}
      <div className="ff-header-top">
        <div className="ff-header-left">
          <Link
            href={vipUser ? "/club-profile" : "/vip-welcome"}
            className="admin-button vip"
          >
            My VIP Profile
          </Link>
        </div>

        <nav className="ff-main-nav">
          <Link href="/my-orders" className="ff-main-link">
            🛍 My Shopping Bag
          </Link>
          <Link href="/" className="ff-main-link">
            Dashboard
          </Link>
          <Link href="/help" className="ff-main-link">
            Help
          </Link>
          <Link href="/about" className="ff-main-link">
            About
          </Link>
          <Link href="/contact" className="ff-main-link">
            Contact
          </Link>
        </nav>

        <div className="ff-admin-ports">
          {/* MANAGEMENT LOGIN - UPDATED TO MATCH SELLER STYLE */}
          <Link href="/management/login" className="admin-button management">
            <span>Management Admin Login</span>
          </Link>

          {/* SELLER LOGIN */}
          <Link href="/seller/login" className="admin-button seller">
            <span>Seller Admin Login</span>
            <span className="sub-text">Become a Seller – Click Here</span>
          </Link>
        </div>
      </div>

      {/* BRAND + SEARCH */}
      <div className="ff-header-middle">
        <div className="ff-middle-spacer"></div>
        <div className="ff-brand-name">FAMOUS FINDS</div>
        <div className="ff-search-container">
          <form action="/search" className="ff-search-form">
            <input
              type="text"
              name="q"
              placeholder="Search"
              className="ff-search-input"
            />
          </form>
        </div>
      </div>

      {/* CATEGORY BAR */}
      <nav className="ff-category-nav">
        {categoryNav.map((item) => (
          <Link key={item.label} href={item.href} className="ff-cat-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <style jsx>{`
        .ff-header {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
        }

        .ff-header-top {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ff-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ff-main-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          flex-wrap: wrap;
          justify-content: center;
          flex: 1;
        }

        .ff-main-link {
          color: #111827;
          text-decoration: none;
          opacity: 0.9;
        }
        .ff-main-link:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .ff-admin-ports {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-button {
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 12px;
          text-decoration: none;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.2;
          white-space: nowrap;
          min-width: 180px; /* Ensures identical width */
          height: 44px;    /* Ensures identical height */
        }

        .admin-button.vip {
          background: #22c55e;
          border: 1px solid #22c55e;
          color: #ffffff;
          min-width: auto;
          height: auto;
          padding: 8px 16px;
        }

        /* Shared Black Style for Management and Seller */
        .admin-button.management,
        .admin-button.seller {
          background: #111827;
          color: #ffffff;
          border: 1px solid #111827;
        }

        .sub-text {
          font-size: 10px;
          opacity: 0.9;
          font-weight: 400;
        }

        .ff-header-middle {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 18px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ff-middle-spacer, .ff-search-container {
          flex: 1;
        }

        .ff-brand-name {
          letter-spacing: 0.25em;
          font-size: 32px;
          font-weight: 800;
          text-align: center;
          flex: 2;
        }

        .ff-search-form {
          display: flex;
          justify-content: flex-end;
        }

        .ff-search-input {
          width: 240px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }

        .ff-category-nav {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          flex-wrap: wrap;
        }

        .ff-cat-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #111827;
          text-decoration: none;
        }
      `}</style>
    </header>
  );
}
