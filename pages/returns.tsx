// FILE: /pages/returns.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Returns() {
  return (
    <>
      <Head>
        <title>Returns – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Returns</h1>
          <p className="mt-3">
            Because every item is unique, returns are handled carefully to
            protect both buyer and seller.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              Buyers receive a short inspection window after delivery to report
              issues.
            </li>
            <li>
              If an item is significantly not as described, our disputes team
              will step in.
            </li>
            <li>
              Some categories (for example beauty products) may be final sale
              only.
            </li>
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}
