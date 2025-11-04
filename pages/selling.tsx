// FILE: /pages/selling.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellingInfo() {
  return (
    <>
      <Head>
        <title>Selling – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Selling on Famous Finds</h1>
          <p className="mt-3">
            Create your listing from the <b>Sell</b> button in the top
            navigation. Great photos and honest descriptions help items sell
            faster.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Use the AI Butler if you need help writing a description.</li>
            <li>Price competitively using similar listings as a guide.</li>
            <li>Track payouts in Wallet → Statements.</li>
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}
