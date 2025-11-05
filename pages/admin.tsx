// FILE: /pages/admin.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AdminAccess() {
  return (
    <>
      <Head>
        <title>Admin Access — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-white">
            Choose Your Console
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-300">
            Select the correct console below. Each console has its own secure
            login page.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">
                Management Admin
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                For the owner and trusted developer to manage the entire marketplace.
              </p>
              <div className="mt-4">
                <Link
                  href="/management/login"
                  className="inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Go to Management Login →
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">
                Seller Console
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                For vetted sellers to manage listings, orders, and payouts.
              </p>
              <div className="mt-4">
                <Link
                  href="/seller/login"
                  className="inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Go to Seller Login →
                </Link>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
