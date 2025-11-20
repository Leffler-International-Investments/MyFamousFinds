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

  const categoryLinks = [
    { label: "NEW ARRIVALS", href: "/category/new-arrivals" },
    { label: "DESIGNERS", href: "/designers" },
    { label: "WOMEN", href: "/category/women" },
    { label: "BAGS", href: "/category/bags" },
    { label: "MEN", href: "/category/men" },
    { label: "JEWELRY", href: "/category/jewelry" },
    { label: "WATCHES", href: "/category/watches" },
  ];

  return (
    <header className="ff-header">
      {/* TOP BAR – your original content, but on white */}
      <div className="ff-header-top">
        <div className="ff-header-left">
          {/* Brand logo */}
          <Link href="/" className="ff-logo">
            <Image
              src="/Famous-Finds-Logo.png"
              alt="Famous Finds Logo"
              width={95}
              height={80}
              priority
            />
          </Link>

          {/* VIP button */}
          <Link
            href={vipUser ? "/club-profile" : "/vip-welcome"}
            className="admin-button vip"
          >
            {vipUser ? "My VIP Profile" : "VIP Front Row"}
          </Link>
        </div>

        {/* Middle nav: Dashboard / Help / About / Contact */}
        <nav className="ff-main-nav">
          <Link href="/my-orders" className="ff-main-link">
            🛍 FF Shopping Bag
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

        {/* Admin portals */}
        <div className="ff-admin-ports">
          <Link href="/management/login" className="admin-button management">
            Management Admin Login
          </Link>
          <Link href="/seller/login" className="admin-button seller">
            Seller Admin Login
          </Link>
        </div>
      </div>

      {/* BRAND ROW + CATEGORY STRIP (Luxelist-style) */}
      <div className="ff-header-bottom">
        <div className="ff-brand-row">
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

        <nav className="ff-category-nav">
          {categoryLinks.map((item) => (
            <Link key={item.label} href={item.href} className="ff-cat-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <style jsx>{`
        .ff-header {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
        }

        /* TOP BAR */
        .ff-header-top {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ff-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .ff-logo {
          display: inline-flex;
          align-items: center;
        }

        .ff-main-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
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
          flex-shrink: 0;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* BOTTOM AREA */
        .ff-header-bottom {
          border-top: 1px solid #e5e7eb;
          padding: 8px 18px 10px;
        }

        .ff-brand-row {
          max-width: 1280px;
          margin: 0 auto 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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
          background: #ffffff;
        }

        .ff-search-input {
          border: none;
          outline: none;
          font-size: 13px;
          width: 100%;
          color: #111827;
        }

        .ff-search-input::placeholder {
          color: #9ca3af;
        }

        .ff-category-nav {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          padding-top: 6px;
          padding-bottom: 4px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ff-cat-link {
          position: relative;
          padding-bottom: 3px;
          text-decoration: none;
          color: #374151;
          white-space: nowrap;
        }

        .ff-cat-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: #111827;
          opacity: 0;
          transform: scaleX(0.4);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .ff-cat-link:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .ff-cat-link:hover {
          color: #111827;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .ff-header-top {
            align-items: flex-start;
          }
          .ff-main-nav {
            justify-content: flex-start;
          }
          .ff-brand-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .ff-search-form {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .ff-category-nav {
            gap: 12px;
            font-size: 10px;
          }
          .ff-brand-name {
            font-size: 14px;
          }
        }
      `}</style>
    </header>
  );
}
