// FILE: /pages/_document.tsx

import { Html, Head, Main, NextScript } from "next/document";

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || "G-0D7XZTGY27";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Analytics 4 — loaded in _document for reliable first-paint inclusion */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}

        {/* Umami Analytics */}
        {process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            async
            defer
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          />
        )}

        {/* Capture PWA install prompt before React hydrates (so it's never lost) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__pwaInstallPrompt=null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__pwaInstallPrompt=e;});`,
          }}
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* Apple iOS meta tags */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Famous Finds" />

        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Famous Finds" />

        {/* Microsoft / Windows */}
        <meta name="msapplication-TileColor" content="#111827" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />

        {/* iOS splash screen */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />

        {/* Smart App Banner for iOS Safari (uncomment when app is published) */}
        {/* <meta name="apple-itunes-app" content="app-id=6740000000" /> */}

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/api/sitemap" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
