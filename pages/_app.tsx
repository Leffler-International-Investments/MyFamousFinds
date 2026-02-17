// FILE: /pages/_app.tsx

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

import "../styles/globals.css";
import Layout from "../components/Layout";
import { ToastProvider } from "../components/Toast";
import ReviewWidgets from "../components/ReviewWidgets";
import Analytics from "../components/Analytics";
import { CurrencyProvider } from "../components/CurrencyToggle";
import { initNativePlugins } from "../utils/capacitor";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";

export default function MyFamousFindsApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Initialize native plugins for Capacitor (iOS/Android)
  useEffect(() => {
    initNativePlugins();
  }, []);

  // path without query string or hash
  const path =
    typeof router.asPath === "string"
      ? router.asPath.split(/[?#]/)[0]
      : "";
  const canonical = `${SITE_URL}${path || "/"}`;

  return (
    <>
      {/* ✅ Global canonical + robots on every page */}
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index,follow" />
      </Head>

      {/* Your existing layout + pages */}
      <CurrencyProvider>
        <ToastProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ToastProvider>
      </CurrencyProvider>

      {/* GA4 Analytics */}
      <Analytics />

      {/* Floating review widget — visible on public-facing pages only (hidden during checkout) */}
      {!router.pathname.startsWith("/management") &&
       !router.pathname.startsWith("/seller") &&
       !router.pathname.startsWith("/product") && (
        <ReviewWidgets />
      )}

    </>
  );
}

