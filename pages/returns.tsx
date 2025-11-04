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

          <h1 className="mt-4 text-2xl font-semibold">Returns & refunds</h1>
          <p className="mt-3 text-gray-300">
            Because items are consigned or sold by independent sellers, returns
            work a little differently to a traditional retailer.
          </p>

          <section className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                Inspection window
              </h2>
              <p className="mt-2">
                For most items, there is a short{" "}
                <span className="font-semibold">inspection window</span> after
                delivery (typically 48 hours). Use this time to check:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-300">
                <li>That the item matches the photos and description.</li>
                <li>Size, fit and condition.</li>
                <li>Any included accessories or original packaging.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                If something isn&apos;t right
              </h2>
              <p className="mt-2">
                If the item is significantly not as described (for example,
                undisclosed damage or incorrect authenticity), contact us as
                soon as possible via the{" "}
                <Link
                  href="/contact"
                  className="underline underline-offset-2 hover:text-gray-100"
                >
                  Contact
                </Link>{" "}
                page. Our team will review the case and may request photos or
                additional information.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                When refunds are issued
              </h2>
              <p className="mt-2">
                If a return is approved, the item will be shipped back to the
                seller and your original payment method will be refunded once
                the item is received. In some rare cases we may issue a partial
                refund or credit instead.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              This is a demo policy for layout purposes only. Final legal terms
              may differ.
            </p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

