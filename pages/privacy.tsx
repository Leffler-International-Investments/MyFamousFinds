// FILE: /pages/privacy.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy – Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Privacy</h1>
          <p className="mt-3 text-gray-300">
            This is a simplified privacy overview for the Famous Finds demo. In
            a production product this would be replaced with full legal terms.
          </p>

          <section className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                What we collect
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>Contact details you provide (such as name and email).</li>
                <li>
                  Order information (items purchased, prices, shipping address).
                </li>
                <li>Technical data like device type and approximate region.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                How we use it
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>To process and deliver your orders.</li>
                <li>To communicate with you about your account or support.</li>
                <li>To improve the Famous Finds experience.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Third parties
              </h2>
              <p className="mt-2">
                We use trusted providers such as Stripe for secure payment
                processing. These providers only receive the information needed
                to perform their services.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
