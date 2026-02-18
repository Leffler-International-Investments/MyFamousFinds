// FILE: /components/Footer.tsx

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ButlerChat from "./ButlerChat";

export default function Footer() {
  const year = new Date().getFullYear();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleDropdown(name: string) {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }

  return (
    <>
      <footer className="ff-footer">
        <div className="ff-footer-inner" ref={dropdownRef}>
          {/* Brand */}
          <div className="ff-footer-brand">
            <div className="ff-footer-title">FAMOUS FINDS</div>
            <div className="ff-footer-copy">
              &copy; {year} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* Main footer navigation row */}
          <nav className="ff-footer-nav">
            {/* AI Concierge link */}
            <div className="ff-footer-item">
              <button
                className="ff-footer-link"
                onClick={() => setIsChatOpen(!isChatOpen)}
                aria-label="Open Famous Concierge"
              >
                Ask the Famous Concierge
              </button>
            </div>

            {/* My Shop dropdown */}
            <div className="ff-footer-item ff-dropdown-wrapper">
              <button
                className="ff-footer-link ff-dropdown-toggle"
                onClick={() => toggleDropdown("shop")}
                aria-expanded={openDropdown === "shop"}
              >
                My Shop
                <span
                  className={`ff-chevron ${openDropdown === "shop" ? "open" : ""}`}
                >
                  ▾
                </span>
              </button>
              {openDropdown === "shop" && (
                <div className="ff-dropdown-menu">
                  <Link
                    href="/my-orders"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Shopping Bag
                  </Link>
                  <Link
                    href="/buying"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Authenticity
                  </Link>
                  <Link
                    href="/privacy"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Privacy
                  </Link>
                </div>
              )}
            </div>

            {/* Services dropdown */}
            <div className="ff-footer-item ff-dropdown-wrapper">
              <button
                className="ff-footer-link ff-dropdown-toggle"
                onClick={() => toggleDropdown("services")}
                aria-expanded={openDropdown === "services"}
              >
                Services
                <span
                  className={`ff-chevron ${openDropdown === "services" ? "open" : ""}`}
                >
                  ▾
                </span>
              </button>
              {openDropdown === "services" && (
                <div className="ff-dropdown-menu">
                  <Link
                    href="/help"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Help
                  </Link>
                  <Link
                    href="/contact"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Contact
                  </Link>
                  <Link
                    href="/about"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    About
                  </Link>
                  <Link
                    href="/returns"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Returns Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="ff-dropdown-link"
                    onClick={() => setOpenDropdown(null)}
                  >
                    Terms &amp; Conditions
                  </Link>
                </div>
              )}
            </div>

            {/* Homepage */}
            <div className="ff-footer-item">
              <Link href="/" className="ff-footer-link">
                Homepage
              </Link>
            </div>

            {/* Sellers */}
            <div className="ff-footer-item">
              <Link href="/seller/login" className="ff-footer-link">
                Sellers
              </Link>
            </div>

            {/* Management */}
            <div className="ff-footer-item">
              <Link href="/management/login" className="ff-footer-link">
                Management
              </Link>
            </div>
          </nav>

          {/* Social media icons */}
          <div className="ff-footer-social">
            <a
              href="#"
              className="ff-social-icon"
              aria-label="Facebook"
              title="Facebook"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="ff-social-icon"
              aria-label="YouTube"
              title="YouTube"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="#"
              className="ff-social-icon"
              aria-label="Instagram"
              title="Instagram"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>
            <a
              href="#"
              className="ff-social-icon"
              aria-label="TikTok"
              title="TikTok"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>

        <style jsx>{`
          .ff-footer {
            margin-top: auto;
            border-top: 1px solid #374151;
            background: #111827;
            color: #f9fafb;
          }

          .ff-footer-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px 16px 28px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .ff-footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .ff-footer-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.25em;
            text-transform: uppercase;
          }

          .ff-footer-copy {
            font-size: 11px;
            color: #9ca3af;
          }

          /* ---- Navigation row ---- */
          .ff-footer-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            flex-wrap: wrap;
          }

          .ff-footer-item {
            position: relative;
            display: flex;
            align-items: center;
          }

          .ff-footer-item + .ff-footer-item::before {
            content: "";
            display: block;
            width: 1px;
            height: 16px;
            background: #4b5563;
            margin: 0 4px;
          }

          /* ---- Shared link / button style ---- */
          .ff-footer-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #d1d5db;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px 14px;
            border-radius: 6px;
            transition: color 0.15s, background 0.15s;
            font-family: inherit;
            letter-spacing: 0.02em;
          }

          .ff-footer-link:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.06);
          }

          /* ---- Dropdown toggle ---- */
          .ff-dropdown-toggle {
            font-family: inherit;
          }

          .ff-chevron {
            display: inline-block;
            font-size: 11px;
            transition: transform 0.2s;
            margin-left: 2px;
          }

          .ff-chevron.open {
            transform: rotate(180deg);
          }

          /* ---- Dropdown menu ---- */
          .ff-dropdown-wrapper {
            position: relative;
          }

          .ff-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 6px 0;
            min-width: 170px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            z-index: 100;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
          }

          .ff-dropdown-link {
            display: block !important;
            width: 100% !important;
            padding: 8px 16px !important;
            font-size: 13px !important;
            color: #d1d5db !important;
            text-decoration: none !important;
            white-space: nowrap !important;
            transition: background 0.12s, color 0.12s;
            text-align: left;
          }

          .ff-dropdown-link:hover {
            background: #374151 !important;
            color: #ffffff !important;
          }

          /* ---- Social icons ---- */
          .ff-footer-social {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding-top: 4px;
          }

          .ff-social-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            transition: color 0.15s, transform 0.15s;
          }

          .ff-social-icon:hover {
            color: #ffffff;
            transform: scale(1.15);
          }

          /* ---- Responsive: stack on mobile ---- */
          @media (max-width: 768px) {
            .ff-footer-nav {
              flex-direction: column;
              gap: 4px;
            }

            .ff-footer-item + .ff-footer-item::before {
              display: none;
            }

            .ff-dropdown-menu {
              position: relative;
              top: auto;
              left: auto;
              transform: none;
              margin-top: 4px;
              box-shadow: none;
              border: 1px solid #374151;
              display: flex;
              flex-direction: column;
            }
          }
        `}</style>

        {/* Global styles needed because styled-jsx scoping doesn't reach
            anchor tags rendered inside <Link> child components */}
        <style jsx global>{`
          .ff-footer-nav .ff-footer-item a.ff-footer-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #d1d5db;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px 14px;
            border-radius: 6px;
            transition: color 0.15s, background 0.15s;
            font-family: inherit;
            letter-spacing: 0.02em;
          }
          .ff-footer-nav .ff-footer-item a.ff-footer-link:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.06);
          }
        `}</style>
      </footer>

      {/* Butler chat panel */}
      <ButlerChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
