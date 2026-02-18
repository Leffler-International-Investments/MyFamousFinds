// FILE: /components/Header.tsx

import Link from "next/link";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import { filtersToQuery, queryToFilters } from "../lib/filterConstants";
import CurrencyToggle from "./CurrencyToggle";

type HeaderProps = {
  filterContent?: React.ReactNode;
  showFilter?: boolean;
  onToggleFilter?: () => void;
};

export default function Header({ filterContent, showFilter, onToggleFilter }: HeaderProps) {
  const router = useRouter();
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => setVipUser(user));
    return () => unsub();
  }, []);

  // Build query string from current URL filter params to carry across page navigations
  const filterQueryString = useMemo(() => {
    if (!router.isReady) return "";
    const parsed = queryToFilters(router.query);
    const q = filtersToQuery({
      titleQuery: parsed.titleQuery || "",
      category: parsed.category || "",
      designer: parsed.designer || "",
      condition: parsed.condition || "",
      material: parsed.material || "",
      size: parsed.size || "",
      color: parsed.color || "",
      minPrice: typeof parsed.minPrice === "number" ? parsed.minPrice : 0,
      maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : 1000000,
      sortBy: parsed.sortBy || "newest",
    });
    const params = new URLSearchParams(q);
    const str = params.toString();
    return str ? `?${str}` : "";
  }, [router.isReady, router.query]);

  const categoryNav = [
    { label: "NEW ARRIVALS", href: "/category/new-arrivals" },
    { label: "FAMOUS", href: "/catalogue" },
    { label: "DESIGNERS", href: "/designers" },
    { label: "CONSIGN", href: "/consign" },
    { label: "WOMEN", href: "/category/women" },
    { label: "BAGS", href: "/category/bags" },
    { label: "MEN", href: "/category/men" },
    { label: "KIDS", href: "/category/kids" },
    { label: "JEWELRY", href: "/category/jewelry" },
    { label: "WATCHES", href: "/category/watches" },
  ];

  // Pages that support filter sync
  const filterSyncPaths = new Set([
    "/category/new-arrivals",
    "/catalogue",
    "/designers",
    "/category/women",
    "/category/bags",
    "/category/men",
    "/category/kids",
    "/category/jewelry",
    "/category/watches",
  ]);

  return (
    <header className="ff-header">
      {/* TOP BAR */}
      <div className="ff-header-top">
        <div className="ff-header-left">
        </div>

        <div className="ff-header-right">
          <CurrencyToggle />
          {vipUser ? (
            <Link href="/account" className="admin-button customer-signin">
              <span>My Account</span>
            </Link>
          ) : (
            <Link href="/login" className="admin-button customer-signin">
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* BRAND + SEARCH + CART */}
      <div className="ff-header-middle">
        <div className="ff-middle-spacer"></div>
        <Link href="/" className="ff-brand-name" style={{ fontSize: "44px", fontWeight: 900 }}>FAMOUS FINDS</Link>
        <div className="ff-search-container">
          <form action="/search" className="ff-search-form">
            <input
              type="text"
              name="q"
              placeholder="Search"
              className="ff-search-input"
            />
          </form>
          <Link href="/cart" className="ff-cart-icon" aria-label="Shopping cart">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* CATEGORY BAR */}
      <nav className="ff-category-nav">
        {categoryNav.map((item) => {
          // Carry filter params to pages that support filtering
          const href = filterSyncPaths.has(item.href)
            ? `${item.href}${filterQueryString}`
            : item.href;
          return (
            <Link key={item.label} href={href} className="ff-cat-link">
              {item.label}
            </Link>
          );
        })}
        {onToggleFilter && (
          <button
            type="button"
            onClick={onToggleFilter}
            className={`ff-filter-toggle${showFilter ? " ff-filter-toggle--active" : ""}`}
          >
            FILTER {showFilter ? "\u25B2" : "\u25BC"}
          </button>
        )}
      </nav>

      {/* FILTER DROPDOWN */}
      {showFilter && filterContent && (
        <div className="ff-filter-dropdown">
          <div className="ff-filter-dropdown-inner">
            {filterContent}
          </div>
        </div>
      )}

      <style jsx>{`
        .ff-header {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
          position: relative;
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

        .ff-header-right {
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
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.2;
          white-space: nowrap;
          height: 40px;
        }

        .admin-button.vip {
          background: #22c55e;
          border: 1px solid #22c55e;
          color: #ffffff;
          padding: 8px 16px;
          height: auto;
        }

        .admin-button.customer-signin {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
        }
        .admin-button.customer-signin:hover {
          background: #f9fafb;
        }

        .admin-button.seller {
          background: #111827;
          color: #ffffff;
          border: 1px solid #111827;
        }

        .ff-header-middle {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 18px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ff-middle-spacer {
          flex: 1;
        }

        .ff-brand-name {
          letter-spacing: 0.25em;
          font-size: 44px !important;
          font-weight: 900 !important;
          text-align: center;
          flex: 2;
          text-decoration: none !important;
          color: #111827 !important;
        }

        .ff-search-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
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

        .ff-cart-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .ff-cart-icon:hover {
          opacity: 0.6;
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

        .ff-filter-toggle {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #111827;
          transition: all 0.15s;
        }
        .ff-filter-toggle:hover {
          background: #f3f4f6;
        }
        .ff-filter-toggle--active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .ff-filter-toggle--active:hover {
          background: #1f2937;
        }

        .ff-filter-dropdown {
          border-top: 1px solid #e5e7eb;
          background: #fafafa;
          padding: 16px 0;
        }
        .ff-filter-dropdown-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 18px;
        }
      `}</style>
    </header>
  );
}
