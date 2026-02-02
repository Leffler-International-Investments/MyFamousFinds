// FILE: /components/Header.tsx

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setVipUser(user));
    return () => unsub();
  }, []);

  // ✅ FIX: each category points to its own correct page
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
          {/* VIP GREEN PILL */}
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
          <Link href="/management/login" className="admin-button management">
            Management Admin Login
          </Link>

          <Link
            href="/seller/login"
            className="admin-button seller"
            style={{
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              lineHeight: "1.1",
              textAlign: "center",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>Seller Admin Login</span>
            <span style={{ fontSize: "10px", opacity: 0.9 }}>
              Become a Seller – Click Here
            </span>
          </Link>
        </div>
      </div>

      {/* BRAND + SEARCH */}
      <div className="ff-header-middle">
        <div className="ff-brand-name">FAMOUS FINDS</div>
        <form action="/search" className="ff-search-form">
          <input
            type="text"
            name="q"
            placeholder="Search"
            className="ff-search-input"
          />
        </form>
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
          padding: 8px 12px;
          font-size: 12px;
          text-decoration: none;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
        }

        .admin-button.vip {
          background: #22c55e;
          border-color: #22c55e;
          color: #ffffff;
        }

        .admin-button.management {
          background: #e5e7eb;
          border-color: #e5e7eb;
        }

        .admin-button.seller {
          background: #111827;
          border-color: #111827;
          color: #ffffff;
        }

        .ff-header-middle {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 18px 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .ff-brand-name {
          letter-spacing: 0.22em;
          font-size: 18px;
          font-weight: 500;
        }

        .ff-search-form {
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }

        .ff-search-input {
          width: min(420px, 100%);
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
          gap: 18px;
          flex-wrap: wrap;
        }

        .ff-cat-link {
          font-size: 12px;
          letter-spacing: 0.12em;
          color: #111827;
          text-decoration: none;
          opacity: 0.85;
        }

        .ff-cat-link:hover {
          opacity: 1;
          text-decoration: underline;
        }
      `}</style>
    </header>
  );
}
