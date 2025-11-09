// FILE: pages/_app.tsx
// This file is NEW and REQUIRED.
// It imports the global stylesheet for all pages.
import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
