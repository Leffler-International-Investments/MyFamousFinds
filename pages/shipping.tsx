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
          <p className="mt-3 text-gray-300">
            This page explains how shipping works for orders placed on Famous
            Finds.
          </p>

          <section className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Where we ship
              </h2>
              <p className="mt-2">
                At this stage Famous Finds is focused on{" "}
                <span className="font-semibold">US-based</span> buyers and
                sellers. Most items ship domestically within the United States.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Shipping methods
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>Tracked shipping is required for all orders.</li>
                <li>
                  High-value items may require a signature on delivery or
                  insured shipping.
                </li>
                <li>
                  The exact carrier (UPS, FedEx, USPS, etc.) depends on the
                  seller and destination.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Dispatch times
              </h2>
              <p className="mt-2">
                Sellers are expected to dispatch orders within{" "}
                <span className="font-semibold">2–3 business days</span> of the
                order being placed, unless otherwise stated on the listing.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Tracking and updates
              </h2>
              <p className="mt-2">
                Once your order ships, tracking details are added to your order
                and emailed to you. You can refer back to your order confirmation
                email at any time.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
