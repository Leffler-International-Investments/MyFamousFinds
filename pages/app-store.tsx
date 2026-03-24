// FILE: /pages/app-store.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SITE_URL = "https://www.myfamousfinds.com";

export default function MyFamousFindsAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsAndroid(/Android/.test(ua));

    // Only trust standalone mode — the app is already running as an installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) setInstalled(true);

    // Pick up prompt captured globally in _document.tsx
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    const promptHandler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", promptHandler);

    // Listen for the REAL install confirmation from the browser
    const installedHandler = () => {
      setInstalling(false);
      setInstalled(true);
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", promptHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleInstall = async () => {
    // iOS — no native prompt, show minimal visual guide
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const result = await prompt.userChoice;
        if (result.outcome === "accepted") {
          setInstalling(true);
          setDeferredPrompt(null);
          (window as any).__pwaInstallPrompt = null;
          setTimeout(() => {
            setInstalling((prev) => {
              if (prev) return false;
              return prev;
            });
          }, 30000);
        }
      } catch {
        // prompt() already used — nothing else to do
      }
    }
  };
  const title = "Get the Famous Finds App — Luxury Resale Marketplace";
  const description =
    "Download Famous Finds on iOS or Android. Shop authenticated luxury bags, watches, jewelry, and fashion from your phone.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Famous Finds",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "iOS, Android",
    url: `${SITE_URL}/app-store`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Famous Finds",
      url: SITE_URL,
    },
  };

  return (
    <div className="page">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_URL}/app-store`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/app-store`} />
        <meta property="og:image" content={`${SITE_URL}/icons/icon-512x512.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/icons/icon-512x512.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px", textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <img
            src="/FF-Logo.png"
            alt="Famous Finds App Icon"
            style={{ width: 120, height: 120, margin: "0 auto 16px", display: "block" }}
          />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", color: "#111" }}>
          Famous Finds
        </h1>
        <p style={{ fontSize: 16, color: "#666", margin: "0 0 32px", lineHeight: 1.6 }}>
          Shop authenticated luxury fashion, bags, watches, and jewelry — all from your phone.
          Make offers, track orders, and get notified about price drops.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360, margin: "0 auto 32px" }}>
          {installed ? (
            <div style={{
              background: "#ecfdf5", color: "#065f46", padding: "14px 24px", borderRadius: 12,
              fontSize: 15, fontWeight: 600, textAlign: "center",
            }}>
              App installed — you&apos;re all set!
            </div>
          ) : installing ? (
            <div style={{
              background: "#fffbeb", color: "#92400e", padding: "14px 24px", borderRadius: 12,
              fontSize: 15, fontWeight: 600, textAlign: "center",
            }}>
              Installing… check your home screen shortly.
            </div>
          ) : (
            <>
              <button
                onClick={handleInstall}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#111827", color: "#fff", padding: "14px 24px", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer",
                }}
              >
                Install App Now
              </button>
            </>
          )}
        </div>

        <div style={{ background: "#f9fafb", borderRadius: 16, padding: "24px 20px", marginBottom: 32, textAlign: "left" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px", color: "#111" }}>
            Why download the app?
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#444", fontSize: 14, lineHeight: 2 }}>
            <li><strong>Instant notifications</strong> — Price drops, offer updates, and shipping alerts</li>
            <li><strong>Faster browsing</strong> — Native performance with smooth scrolling</li>
            <li><strong>Biometric login</strong> — Sign in with Face ID or fingerprint</li>
            <li><strong>Offline wishlist</strong> — Save favorites even without connection</li>
            <li><strong>Camera upload</strong> — List items directly from your phone camera</li>
          </ul>
        </div>

        <p style={{ fontSize: 14, color: "#999" }}>
          Or continue browsing on the web:{" "}
          <Link href="/" style={{ color: "#111", fontWeight: 600 }}>
            Open Famous Finds
          </Link>
        </p>
      </main>

      {/* iOS guide overlay */}
      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
            padding: "0 16px 40px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e293b", color: "#fff", borderRadius: 20,
              padding: "28px 24px", maxWidth: 340, width: "100%",
              textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
                <rect x="3" y="15" width="18" height="6" rx="2" fill="none" />
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              Tap
              <span style={{ display: "inline-flex", verticalAlign: "middle", margin: "0 6px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>
              then <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              The share button is at the bottom of Safari
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: 10,
                padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        .page {
          background: #fff;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
