// FILE: /pages/app-store.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SITE_URL = "https://www.myfamousfinds.com";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.myfamousfinds.app";
const APP_STORE_URL =
  "https://apps.apple.com/app/famous-finds/id6740000000";

export default function MyFamousFindsAppPage() {
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
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#111827", color: "#fff", padding: "14px 24px", borderRadius: 12,
              fontSize: 16, fontWeight: 700, textDecoration: "none",
            }}
          >
            Download for iOS
          </a>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", color: "#111", padding: "14px 24px", borderRadius: 12,
              fontSize: 16, fontWeight: 700, textDecoration: "none",
              border: "2px solid #111827",
            }}
          >
            Download for Android
          </a>
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
