// FILE: /components/AdminPlaceholder.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

// This is a reusable component for all your "under construction" admin pages
export default function AdminPlaceholder({ pageTitle }: { pageTitle: string }) {
  return (
    <>
      <Head>
        <title>{pageTitle} — Admin</title>
      </Head>
      {/* Light gray page background */}
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        {/* Centered content */}
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

          {/* White box for the content */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">
              Page Under Construction
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This page ({pageTitle}) is a placeholder. The link from the
              dashboard is correct, but the full UI for this feature has not
              been built yet.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
