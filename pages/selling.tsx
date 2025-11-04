// FILE: /pages/selling.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellingInfo() {
  return (
    <>
      <Head>
        <title>Selling on Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold">Selling guide</h1>
          <p className="mt-3 text-gray-300">
            A quick overview of how to list items and get paid as a seller on
            Famous Finds.
          </p>

          <section className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                1. Submit your item
              </h2>
              <p className="mt-2">
                Use the{" "}
                <Link
                  href="/sell"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Sell form
                </Link>{" "}
                to send us details and photos. Our team reviews every submission
                for brand, condition and fit with the marketplace.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                2. Approval & listing
              </h2>
              <p className="mt-2">
                Once approved, we create a listing on Famous Finds. We may
                adjust the title, description or price to match our house
                standards and current market data.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                3. Shipping & delivery
              </h2>
              <p className="mt-2">
                When an item sells, we&apos;ll send you a shipping label or
                instructions. You&apos;re expected to dispatch within the
                agreed time frame and upload tracking.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                4. Getting paid
              </h2>
              <p className="mt-2">
                Payouts are processed via Stripe Connect to your nominated bank
                account. You can track balances and payouts in your{" "}
                <Link
                  href="/seller/wallet"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Wallet
                </Link>{" "}
                and monthly{" "}
                <Link
                  href="/seller/statements"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Statements
                </Link>
                .
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

