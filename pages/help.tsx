// FILE: /pages/help.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Help() {
  return (
    <>
      <Head>
        <title>Help Center – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Help Center</h1>
          <p className="mt-3">
            Start here for answers about buying, selling, shipping and returns.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <Link href="/shipping" className="underline">
                Shipping
              </Link>{" "}
              – how and when items are delivered.
            </li>
            <li>
              <Link href="/returns" className="underline">
                Returns
              </Link>{" "}
              – what happens if something isn&apos;t right.
            </li>
            <li>
              <Link href="/buying" className="underline">
                Buying
              </Link>{" "}
              – tips for safe, smart purchases.
            </li>
            <li>
              <Link href="/selling" className="underline">
                Selling
              </Link>{" "}
              – how to list, price and get paid.
            </li>
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}
