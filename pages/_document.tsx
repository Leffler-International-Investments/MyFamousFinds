// FILE: /pages/_document.tsx

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Keep sitemap link so tools can discover it */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* Add any favicons / fonts here if you have them */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
