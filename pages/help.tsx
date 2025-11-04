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
          <p className="mt-3 text-gray-300">
            Answers to the most common questions about buying, selling, shipping
            and returns on Famous Finds.
          </p>

          <section className="mt-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Buying on Famous Finds
              </h2>
              <p className="mt-2">
                All items are reviewed before they go live. Payments are
                processed securely via Stripe and are only released to the
                seller once the order is delivered or your return window
                passes.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>Prices are shown in USD.</li>
                <li>Tax is calculated at checkout where applicable.</li>
                <li>
                  You&apos;ll receive order updates by email from Famous Finds.
                </li>
              </ul>
              <p className="mt-2 text-xs text-gray-400">
                Need more detail? See our{" "}
                <Link
                  href="/buying"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Buying guide
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Shipping & delivery
              </h2>
              <p className="mt-2">
                Shipping is organised by either the seller or Famous Finds,
                depending on the item and location. Tracking details are always
                provided once an order is dispatched.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Read the full{" "}
                <Link
                  href="/shipping"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Shipping policy
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Returns & refunds
              </h2>
              <p className="mt-2">
                We want you to be happy with your purchase. For most items there
                is a short inspection window after delivery. If something isn&apos;t
                as described, we&apos;ll work with you and the seller to make it
                right.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                See the{" "}
                <Link
                  href="/returns"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Returns policy
                </Link>{" "}
                for full details.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Selling on Famous Finds
              </h2>
              <p className="mt-2">
                Sellers submit items for review. We check images, description
                and pricing before items appear in the storefront. Payouts are
                handled via Stripe to your connected bank account.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Learn more in the{" "}
                <Link
                  href="/selling"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Selling guide
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Still need help?
              </h2>
              <p className="mt-2">
                If you can&apos;t find what you&apos;re looking for, reach out to our
                team.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>
                  Send us a message on the{" "}
                  <Link
                    href="/contact"
                    className="underline underline-offset-2 hover:text-gray-100"
                  >
                    Contact page
                  </Link>
                  .
                </li>
                <li>
                  Or email{" "}
                  <a
                    href="mailto:support@famous-finds.com"
                    className="underline underline-offset-2 hover:text-gray-100"
                  >
                    support@famous-finds.com
                  </a>
                  .
                </li>
              </ul>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
