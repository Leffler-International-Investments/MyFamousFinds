// FILE: /components/Header.tsx
// (This is your original file with ONLY the dropdown fix added)

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

      {/* your entire top area is untouched */}
      {/* ------------------------------------ */}

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
            {vipUser ? "My VIP Profile" : "My VIP Profile"}
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
          <Link href="/seller/login" className="admin-button seller">
            Seller Admin Login
          </Link>
        </div>
      </div>

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

      {/* ------------------------------- */}
      {/* CATEGORY NAV WITH FIXED DROPDOWN */}
      {/* ------------------------------- */}

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

      <style jsx>
        {`
          /* EVERYTHING BELOW IS YOUR ORIGINAL STYLE, EXCEPT 2 LINES ADDED */

          .ff-cat-item {
            position: relative;
          }

          /* FIX 1: keep menu open while moving mouse into submenu */
          .ff-cat-item:hover .ff-megamenu,
          .ff-megamenu:hover {
            display: block;
          }

          .ff-megamenu {
            position: absolute;
            top: 24px;
            left: 0;
            min-width: 220px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
            padding: 10px 14px;
            display: none;
            z-index: 20;
          }

        `}
      </style>

    </header>
  );
}
