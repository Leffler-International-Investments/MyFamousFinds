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
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Pick up prompt captured globally in _document.tsx
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const result = await prompt.userChoice;
        if (result.outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).__pwaInstallPrompt = null;
          setInstalled(true);
        }
      } catch {
        // prompt() already used — can't re-prompt
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
            src="/icons/icon-192x192.png"
            alt="Famous Finds App Icon"
            style={{ width: 96, height: 96, borderRadius: 20, margin: "0 auto 16px", display: "block", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
          />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", color: "#111" }}>
          Famous Finds
        </h1>
        <p style={{ fontSize: 16, color: "#666", margin: "0 0 32px", lineHeight: 1.6 }}>
          Shop authenticated luxury fashion, bags, watches, and jewelry — all from your phone.
          Make offers, track orders, and get notified about price drops.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto 32px" }}>
          {installed ? (
            <div style={{
              background: "#ecfdf5", color: "#065f46", padding: "14px 24px", borderRadius: 12,
              fontSize: 15, fontWeight: 600, textAlign: "center",
            }}>
              App installed successfully
            </div>
          ) : deferredPrompt ? (
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
          ) : isIOS ? (
            <div style={{
              background: "#f0f9ff", color: "#1e40af", padding: "16px 20px", borderRadius: 12,
              fontSize: 14, lineHeight: 1.6, textAlign: "left",
            }}>
              <strong>Install on iPhone / iPad:</strong><br />
              Tap the <strong>Share</strong> button in Safari (the square with an arrow), then tap <strong>&quot;Add to Home Screen&quot;</strong>.
            </div>
          ) : (
            <div style={{
              background: "#f0f9ff", color: "#1e40af", padding: "16px 20px", borderRadius: 12,
              fontSize: 14, lineHeight: 1.6, textAlign: "left",
            }}>
              <strong>Install on your phone:</strong><br />
              Open this page on your mobile phone, then tap <strong>&quot;Install App Now&quot;</strong> or use your browser menu to <strong>&quot;Add to Home Screen&quot;</strong>.
            </div>
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
