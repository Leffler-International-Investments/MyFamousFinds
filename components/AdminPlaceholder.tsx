// FILE: /components/AdminPlaceholder.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

// You can still use this for any *future* pages that are not ready yet
export default function AdminPlaceholder({ pageTitle }: { pageTitle: string }) {
  return (
    <>
      <Head>
        <title>{pageTitle} — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {pageTitle}
            </h1>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">
              Page Under Construction
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This page ({pageTitle}) has not been fully implemented yet.
              The navigation link works; you can plug in real data and
              components here later.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
