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

  // Save & restore scroll position so "Back to …" links return to where you were
  useEffect(() => {
    // Prevent browser from doing its own scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const SCROLL_KEY = "ff-scroll-positions";

    function getStore(): Record<string, number> {
      try {
        return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
      } catch {
        return {};
      }
    }

    // Before navigating away, save the current scroll position
    const handleRouteChangeStart = () => {
      const store = getStore();
      store[router.asPath.split(/[?#]/)[0]] = window.scrollY;
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify(store));
    };

    // After navigating to a page, restore scroll if we have a saved position
    const handleRouteChangeComplete = (url: string) => {
      const path = url.split(/[?#]/)[0];
      const store = getStore();
      const saved = store[path];
      if (typeof saved === "number" && saved > 0) {
        // Clean up the saved position
        delete store[path];
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify(store));

        // Temporarily disable smooth scrolling so scrollTo jumps instantly
        // instead of animating (base.css sets scroll-behavior: smooth).
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";

        // Robust restore: Next.js Link (scroll={true}) may scroll to top
        // after this event, and page content may still be loading.
        // Retry every 50 ms for up to 1 s to override and wait for the
        // page to be tall enough to reach the saved offset.
        let attempts = 0;
        const maxAttempts = 20;
        const timer = setInterval(() => {
          window.scrollTo(0, saved);
          attempts++;
          if (Math.abs(window.scrollY - saved) < 5 || attempts >= maxAttempts) {
            clearInterval(timer);
            // Re-enable smooth scrolling
            html.style.scrollBehavior = "";
          }
        }, 50);
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router]);

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

