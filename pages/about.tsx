// FILE: /pages/about.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function About() {
  return (
    <>
      <Head>
        <title>About – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">About Famous Finds</h1>
          <p className="mt-3">
            Famous Finds is a curated marketplace for authenticated luxury and
            premium fashion. Every item is reviewed before it goes live so
            buyers can shop with confidence and sellers can reach the right
            audience.
          </p>
          <p className="mt-3">
            Our community is global and inclusive – different sizes, different
            colours, different stories – all sharing a love of beautiful,
            well-made pieces.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
