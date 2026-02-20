// FILE: /components/Footer.tsx

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ButlerChat from "./ButlerChat";

type FooterSection = {
  title: string;
  links: { label: string; href?: string; action?: () => void }[];
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Detect PWA install capability
  useEffect(() => {
    // Already running as installed app
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS Safari
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Pick up prompt captured globally in _document.tsx (fires before React)
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    // Also listen for late-arriving prompt (Chrome waits for user engagement)
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    // Check again in case the prompt arrived after initial render
    const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const result = await prompt.userChoice;
        if (result.outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).__pwaInstallPrompt = null;
        }
      } catch {
        // prompt() can only be called once — show manual instructions
        setShowInstallTip(true);
      }
    } else {
      setShowInstallTip(true);
    }
  };

  const toggleSection = useCallback((index: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const sections: FooterSection[] = [
    {
      title: "Our Services",
      links: [
        { label: "VIP Club", href: "/vip-welcome" },
        { label: "Famous Concierge", action: () => setIsChatOpen(!isChatOpen) },
      ],
    },
    {
      title: "Buy",
      links: [
        { label: "Buying Guide", href: "/buying" },
        { label: "My Orders", href: "/my-orders" },
        { label: "Authenticity", href: "/buying#authenticity" },
      ],
    },
    {
      title: "Sell",
      links: [
        { label: "Add Item", href: "/seller/bulk-simple" },
        { label: "How to Sell", href: "/selling" },
        { label: "Seller Login", href: "/seller/login" },
        { label: "Seller T&Cs", href: "/seller-terms" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "FAQ", href: "/help" },
        { label: "Contact", href: "/contact" },
        { label: "Shipping & Delivery", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "Privacy", href: "/privacy" },
      ],
    },
    {
      title: "About Famous Finds",
      links: [
        { label: "About", href: "/about" },
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Management", href: "/management/login" },
      ],
    },
  ];

  return (
    <>
      <footer className="ff-footer">
        <div className="ff-footer-inner">
          {/* ---- Column grid / Accordion ---- */}
          <nav className="ff-footer-columns">
            {sections.map((section, idx) => {
              const isOpen = openSections.has(idx);
              return (
                <div key={section.title} className={`ff-footer-col${isMobile ? " ff-footer-col--mobile" : ""}`}>
                  {isMobile ? (
                    <button
                      type="button"
                      className="ff-col-heading ff-col-heading--toggle"
                      onClick={() => toggleSection(idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{section.title}</span>
                      <svg
                        className={`ff-chevron${isOpen ? " ff-chevron--open" : ""}`}
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  ) : (
                    <h3 className="ff-col-heading">{section.title}</h3>
                  )}
                  <ul className={`ff-col-list${isMobile && !isOpen ? " ff-col-list--hidden" : ""}`}>
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.href ? (
                          <Link href={link.href} className="ff-col-link">
                            {link.label}
                          </Link>
                        ) : (
                          <button
                            className="ff-col-link ff-col-btn"
                            onClick={link.action}
                          >
                            {link.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* ---- Social media icons ---- */}
          <div className="ff-footer-social">
            <span
              className="ff-social-icon ff-social-coming-soon"
              aria-label="Facebook"
              title="Facebook — Coming soon"
              role="button"
              tabIndex={0}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="ff-tooltip">Facebook will be uploaded soon</span>
            </span>
            <a
              href="https://www.youtube.com/myfamousfinds"
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
              href="https://www.tiktok.com/@myfamousfinds"
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

          {/* ---- Install App button (always visible, including on mobile/standalone) ---- */}
          <div className="ff-install-section">
            <button
              type="button"
              className="ff-install-btn"
              onClick={handleInstallClick}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isStandalone ? "Share App with Friends" : "Install App on Your Mobile"}
            </button>
            {showInstallTip && (
              <div className="ff-install-tip">
                {isStandalone ? (
                  <p>
                    Share <strong>myfamousfinds.com</strong> with friends — they
                    can install it from their browser with one tap!
                  </p>
                ) : isIOS ? (
                  <p>
                    Tap the{" "}
                    <span style={{ fontSize: 16 }}>&#x2191;&#xFE0E;</span>{" "}
                    <strong>Share</strong> button at the bottom of Safari, then tap{" "}
                    <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                ) : (
                  <p>
                    Tap the <strong>&#x22EE;</strong> menu (top-right), then tap{" "}
                    <strong>&quot;Install App&quot;</strong> or{" "}
                    <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                )}
              </div>
            )}
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

          /* ---- Column grid (desktop) ---- */
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
            background: none;
            border: none;
            padding: 0;
            font-family: inherit;
            cursor: default;
            text-align: left;
          }

          .ff-col-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .ff-col-list--hidden {
            display: none;
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

          .ff-social-coming-soon {
            position: relative;
            cursor: default;
          }

          .ff-tooltip {
            display: none;
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: #d1d5db;
            font-size: 11px;
            white-space: nowrap;
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid #374151;
            margin-bottom: 6px;
            pointer-events: none;
          }

          .ff-social-coming-soon:hover .ff-tooltip,
          .ff-social-coming-soon:focus .ff-tooltip {
            display: block;
          }

          /* ---- Install App button ---- */
          .ff-install-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .ff-install-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            border-radius: 999px;
            border: 1px solid #4b5563;
            background: rgba(255, 255, 255, 0.06);
            color: #f9fafb;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .ff-install-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: #9ca3af;
          }

          .ff-install-tip {
            font-size: 12px;
            color: #9ca3af;
            text-align: left;
            margin: 0;
            line-height: 1.6;
            max-width: 360px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 12px 16px;
            border: 1px solid #374151;
          }

          .ff-install-tip p {
            margin: 0 0 8px;
          }

          .ff-install-tip p:last-child {
            margin-bottom: 0;
          }

          /* ---- Chevron for mobile accordion ---- */
          .ff-chevron {
            transition: transform 0.25s ease;
            flex-shrink: 0;
          }

          .ff-chevron--open {
            transform: rotate(180deg);
          }

          /* ---- Link styles (global for Next.js Link) ---- */
          :global(.ff-col-link) {
            font-size: 13px;
            color: #d1d5db;
            text-decoration: none;
            transition: color 0.15s;
            line-height: 1.4;
          }

          :global(.ff-col-link:hover) {
            color: #ffffff;
          }

          /* ---- Mobile accordion ---- */
          @media (max-width: 768px) {
            .ff-footer-columns {
              display: flex;
              flex-direction: column;
              gap: 0;
            }

            .ff-footer-col--mobile {
              border-bottom: 1px solid #1f2937;
              gap: 0;
            }

            .ff-col-heading--toggle {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              padding: 16px 0;
              cursor: pointer;
              color: #f9fafb;
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin: 0;
              -webkit-tap-highlight-color: transparent;
            }

            .ff-col-list {
              padding-bottom: 16px;
              gap: 10px;
            }

            .ff-col-list--hidden {
              display: none;
            }

            :global(.ff-col-link) {
              font-size: 14px;
              color: #9ca3af;
              padding: 2px 0;
              display: block;
            }

            .ff-col-btn {
              text-align: left;
            }

            .ff-footer-inner {
              padding: 0 20px 28px;
              gap: 20px;
            }

            .ff-footer-social {
              padding-top: 8px;
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
