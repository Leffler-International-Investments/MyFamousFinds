// FILE: /pages/_app.tsx

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";

import "../styles/globals.css";
import Layout from "../components/Layout";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";

export default function MyFamousFindsApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

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
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

