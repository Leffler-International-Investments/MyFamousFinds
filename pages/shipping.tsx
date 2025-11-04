// FILE: /pages/shipping.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Shipping() {
  return (
    <>
      <Head>
        <title>Shipping – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Shipping</h1>
          <p className="mt-3">
            This is a demo shipping policy. Replace it with your final terms.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Items are shipped after they pass authentication.</li>
            <li>Typical US delivery time is 3–5 business days.</li>
            <li>Tracking details are shared with buyers by email.</li>
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}
