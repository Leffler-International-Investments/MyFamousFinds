// FILE: /components/Header.tsx

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseClientReady } from "../utils/firebaseClient";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    // ✅ Prevent client-side crash when Firebase client env vars are missing
    if (!firebaseClientReady || !auth) return;

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
          <Link href="/management/login" className="admin-button management">
            <span>Management Admin Login</span>
          </Link>

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
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .admin-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          white-space: nowrap;
        }

        .admin-button.seller {
          border-color: #fb923c;
          background: #fff7ed;
        }
        .admin-button.management {
          border-color: #60a5fa;
          background: #eff6ff;
        }
        .admin-button.vip {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .sub-text {
          font-weight: 700;
          opacity: 0.85;
        }

        .ff-header-middle {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 18px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
        }

        .ff-brand-name {
          font-size: 22px;
          letter-spacing: 0.18em;
          font-weight: 900;
          text-align: center;
        }

        .ff-search-container {
          display: flex;
          justify-content: flex-end;
        }
        .ff-search-form {
          width: min(320px, 100%);
        }
        .ff-search-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
        }

        .ff-category-nav {
          width: 100%;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 10px 12px;
        }
        .ff-cat-link {
          text-decoration: none;
          color: #111827;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.06em;
        }
        .ff-cat-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 760px) {
          .ff-header-middle {
            grid-template-columns: 1fr;
          }
          .ff-search-container {
            justify-content: center;
          }
          .ff-brand-name {
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}
