// FILE: /components/Footer.tsx

import Link from "next/link";
import { useState } from "react";
import ButlerChat from "./ButlerChat";

export default function Footer() {
  const year = new Date().getFullYear();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <footer className="ff-footer">
        <div className="ff-footer-inner">
          {/* ---- Column grid ---- */}
          <nav className="ff-footer-columns">
            {/* OUR SERVICES */}
            <div className="ff-footer-col">
              <h3 className="ff-col-heading">Our Services</h3>
              <ul className="ff-col-list">
                <li>
                  <Link href="/vip-welcome" className="ff-col-link">
                    VIP Club
                  </Link>
                </li>
                <li>
                  <button
                    className="ff-col-link ff-col-btn"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                  >
                    Famous Concierge
                  </button>
                </li>
              </ul>
            </div>

            {/* BUY */}
            <div className="ff-footer-col">
              <h3 className="ff-col-heading">Buy</h3>
              <ul className="ff-col-list">
                <li>
                  <Link href="/buying" className="ff-col-link">
                    Buying Guide
                  </Link>
                </li>
                <li>
                  <Link href="/my-orders" className="ff-col-link">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href="/buying#authenticity" className="ff-col-link">
                    Authenticity
                  </Link>
                </li>
              </ul>
            </div>

            {/* SELL */}
            <div className="ff-footer-col">
              <h3 className="ff-col-heading">Sell</h3>
              <ul className="ff-col-list">
                <li>
                  <Link href="/selling" className="ff-col-link">
                    How to Sell
                  </Link>
                </li>
                <li>
                  <Link href="/seller/login" className="ff-col-link">
                    Seller Login
                  </Link>
                </li>
                <li>
                  <Link href="/seller-terms" className="ff-col-link">
                    Seller T&amp;Cs
                  </Link>
                </li>
              </ul>
            </div>

            {/* HELP */}
            <div className="ff-footer-col">
              <h3 className="ff-col-heading">Help</h3>
              <ul className="ff-col-list">
                <li>
                  <Link href="/help" className="ff-col-link">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="ff-col-link">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="ff-col-link">
                    Shipping &amp; Delivery
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="ff-col-link">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="ff-col-link">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            {/* ABOUT FAMOUS FINDS */}
            <div className="ff-footer-col">
              <h3 className="ff-col-heading">About Famous Finds</h3>
              <ul className="ff-col-list">
                <li>
                  <Link href="/about" className="ff-col-link">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="ff-col-link">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/management/login" className="ff-col-link">
                    Management
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* ---- Social media icons ---- */}
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
              href="https://www.youtube.com/@myfamousfinds"
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
              href="https://www.instagram.com/myfamousfinds"
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
              href="https://www.tiktok.com/@myfamousfind"
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

          {/* ---- Brand + copyright ---- */}
          <div className="ff-footer-brand">
            <div className="ff-footer-title">FAMOUS FINDS</div>
            <div className="ff-footer-copy">
              &copy; {year} Famous Finds. All rights reserved. Curated pre-loved luxury.
            </div>
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
            padding: 40px 24px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 28px;
          }

          /* ---- Column grid ---- */
          .ff-footer-columns {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 32px;
            width: 100%;
          }

          .ff-footer-col {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .ff-col-heading {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #9ca3af;
            margin: 0 0 2px;
          }

          .ff-col-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .ff-col-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-family: inherit;
            text-align: left;
          }

          /* ---- Brand + copyright ---- */
          .ff-footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            text-align: center;
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

          /* ---- Social icons ---- */
          .ff-footer-social {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
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
            .ff-footer-columns {
              grid-template-columns: repeat(2, 1fr);
              gap: 24px 16px;
            }
          }

          @media (max-width: 480px) {
            .ff-footer-columns {
              grid-template-columns: 1fr;
              gap: 20px;
              text-align: center;
            }

            .ff-footer-col {
              align-items: center;
            }
          }
        `}</style>
      </footer>

      {/* Global styles for Next.js Link components inside footer columns */}
      <style jsx global>{`
        .ff-col-link {
          font-size: 13px;
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.15s;
          line-height: 1.4;
        }

        .ff-col-link:hover {
          color: #ffffff;
        }
      `}</style>

      {/* Butler chat panel */}
      <ButlerChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
