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
    {
      label: "NEW ARRIVALS",
      href: "/category/new-arrivals",
      submenu: [
        { label: "All New Arrivals", href: "/category/new-arrivals" },
        { label: "New Bags", href: "/category/bags?sort=new" },
        { label: "New Shoes", href: "/category/shoes?sort=new" },
        { label: "New Watches", href: "/category/watches?sort=new" },
      ],
    },
    {
      label: "DESIGNERS",
      href: "/designers",
      submenu: [
        { label: "All Designers", href: "/designers" },
        { label: "Chanel", href: "/designers/chanel" },
        { label: "Louis Vuitton", href: "/designers/louis-vuitton" },
        { label: "Prada", href: "/designers/prada" },
      ],
    },
    {
      label: "WOMEN",
      href: "/category/women",
      submenu: [
        { label: "All Women", href: "/category/women" },
        { label: "Bags", href: "/category/bags?for=women" },
        { label: "Shoes", href: "/category/shoes?for=women" },
        { label: "Clothing", href: "/category/clothing?for=women" },
      ],
    },
    {
      label: "BAGS",
      href: "/category/bags",
      submenu: [
        { label: "All Bags", href: "/category/bags" },
        { label: "Totes", href: "/category/bags?tote=1" },
        { label: "Crossbody", href: "/category/bags?crossbody=1" },
        { label: "Mini Bags", href: "/category/bags?mini=1" },
      ],
    },
    {
      label: "MEN",
      href: "/category/men",
      submenu: [
        { label: "All Men", href: "/category/men" },
        { label: "Bags", href: "/category/bags?for=men" },
        { label: "Shoes", href: "/category/shoes?for=men" },
        { label: "Accessories", href: "/category/accessories?for=men" },
      ],
    },
    {
      label: "JEWELRY",
      href: "/category/jewelry",
      submenu: [
        { label: "All Jewelry", href: "/category/jewelry" },
        { label: "Necklaces", href: "/category/jewelry?type=necklace" },
        { label: "Bracelets", href: "/category/jewelry?type=bracelet" },
        { label: "Earrings", href: "/category/jewelry?type=earrings" },
      ],
    },
    {
      label: "WATCHES",
      href: "/category/watches",
      submenu: [
        { label: "All Watches", href: "/category/watches" },
        { label: "Men's Watches", href: "/category/watches?for=men" },
        { label: "Women's Watches", href: "/category/watches?for=women" },
      ],
    },
  ];

  return (
    <header className="ff-header">
      {/* TOP BAR: logo + VIP + nav + admin buttons */}
      <div className="ff-header-top">
        <div className="ff-header-left">
          <Link href="/" className="ff-logo">
            <Image
              src="/Famous-Finds-Logo.png"
              alt="Famous Finds Logo"
              width={95}
              height={80}
              priority
            />
          </Link>

          <Link
            href={vipUser ? "/club-profile" : "/vip-welcome"}
            className="admin-button vip"
          >
            My VIP Profile
          </Link>
        </div>

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

        <div className="ff-admin-ports">
          <Link href="/management/login" className="admin-button management">
            Management Admin Login
          </Link>

          {/* ⭐ UPDATED BUTTON WITH TWO LINES INSIDE ⭐ */}
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

      {/* BRAND ROW + SEARCH */}
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

      {/* CATEGORY STRIP + DROPDOWNS */}
      <nav className="ff-category-nav">
        {categoryNav.map((item) => (
          <div key={item.label} className="ff-cat-item">
            <Link href={item.href} className="ff-cat-link">
              {item.label}
            </Link>

            {item.submenu && (
              <div className="ff-megamenu">
                <ul className="ff-megamenu-list">
                  {item.submenu.map((sub) => (
                    <li key={sub.label}>
                      <Link href={sub.href} className="ff-megamenu-link">
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
          gap: 16px;
          flex-wrap: wrap;
        }

        .ff-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
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

        .admin-button {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 11px;
          text-decoration: none;
          color: #374151;
          background: #f9fafb;
          white-space: nowrap;
        }

        .admin-button.seller {
          border-color: #14b8a6;
          color: #0f766e;
          background: #ecfeff;
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
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid #e5e7eb;
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
          padding: 6px 18px 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ff-cat-item {
          position: relative;
        }

        .ff-cat-link {
          text-decoration: none;
          color: #374151;
          padding-bottom: 4px;
          white-space: nowrap;
        }

        .ff-cat-link:hover {
          color: #111827;
          border-bottom: 2px solid #111827;
        }

        .ff-megamenu {
          position: absolute;
          top: calc(100% - 4px);
          margin-top: 0;
          left: 0;
          min-width: 220px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 10px 14px;
          display: none;
          z-index: 20;
        }

        .ff-megamenu-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ff-megamenu-link {
          display: block;
          padding: 5px 0;
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
        }

        .ff-megamenu-link:hover {
          color: #111827;
        }

        .ff-cat-item:hover .ff-megamenu {
          display: block;
        }

        @media (max-width: 900px) {
          .ff-header-top {
            align-items: flex-start;
          }
          .ff-main-nav {
            justify-content: flex-start;
          }
          .ff-header-middle {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .ff-search-form {
            width: 100%;
          }
          .ff-category-nav {
            gap: 14px;
            font-size: 10px;
          }
          .ff-megamenu {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .ff-brand-name {
            font-size: 14px;
          }
        }
      `}</style>
    </header>
  );
}
