// FILE: /pages/buying.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Buying() {
  return (
    <>
      <Head>
        <title>Buying on Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Buying guide</h1>
          <p className="mt-3 text-gray-300">
            Everything you need to know about shopping safely on Famous Finds.
          </p>

          <section className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Authenticity & review
              </h2>
              <p className="mt-2">
                Every listing is reviewed before it goes live. For higher-value
                items we may request extra images or documents from the seller.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Payments & security
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>All payments are processed via Stripe.</li>
                <li>
                  Your card details are handled by Stripe, not stored by Famous
                  Finds.
                </li>
                <li>
                  Orders are only paid out to the seller after delivery or after
                  the inspection window closes.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Fees & taxes
              </h2>
              <p className="mt-2">
                Prices shown on the site are for the item only. Shipping and any
                applicable taxes are calculated at checkout before you confirm
                payment.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
