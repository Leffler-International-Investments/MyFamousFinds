// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ListingQueue() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>Listing Review Queue — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Listing Review Queue
          </h1>
          <Link
            href="/management/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Management Dashboard
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Page Coming Soon
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This page will display a queue of new product listings submitted by
            sellers for management approval.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
