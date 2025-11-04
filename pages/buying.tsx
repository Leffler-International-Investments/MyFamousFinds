// FILE: /pages/buying.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Buying() {
  return (
    <>
      <Head>
        <title>Buying – Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">Buying on Famous Finds</h1>
          <p className="mt-3">
            Browse by category, favourite brands or curated collections, then
            check size and condition details before you buy.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Every item is checked for authenticity before it ships.</li>
            <li>
              Use Support if you ever receive something that doesn&apos;t match
              the description.
            </li>
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}
