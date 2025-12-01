// FILE: /components/Header.tsx

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setVipUser(user));
    return () => unsub();
  }, []);

  const categoryNav = [
    { label: "NEW ARRIVALS", href: "/category/new-arrivals" },
    { label: "CATALOGUE", href: "/designers" },
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

          {/* 👉 LOGO WAS HERE — REMOVED, NOTHING ELSE CHANGED */}

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
          text-decoration: none;
          color: #4b5563;
          white-space: nowrap;
        }
        .ff-main-link:hover {
          color: #111827;
        }

        .ff-admin-ports {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .admin-button {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 11px;
          text-decoration: none;
          color: #374151;
          background: #f9fafb;
        }

        .admin-button.seller {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }

        .admin-button.management {
          border-color: #6366f1;
          color: #312e81;
          background: #eef2ff;
        }

        .admin-button.vip {
          border-color: #f97316;
          color: #9a3412;
          background: #fffbeb;
        }

        .ff-header-middle {
          max-width: 1280px;
          margin: 0 auto;
          padding: 6px 18px 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ff-brand-name {
          font-size: 16px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .ff-search-form {
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 4px 10px;
          min-width: 180px;
          display: flex;
          align-items: center;
        }

        .ff-search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 13px;
        }

        .ff-category-nav {
          max-width: 1280px;
          margin: 0 auto;
          padding: 6px 18px 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ff-cat-link {
          text-decoration: none;
          color: #374151;
          white-space: nowrap;
        }

        .ff-cat-link:hover {
          color: #111827;
          border-bottom: 2px solid #111827;
        }
      `}</style>
    </header>
  );
}
