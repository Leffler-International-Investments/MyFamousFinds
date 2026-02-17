// FILE: /pages/_document.tsx

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />

        {/* Favicons */}
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
