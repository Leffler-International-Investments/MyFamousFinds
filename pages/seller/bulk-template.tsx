// FILE: /pages/seller/bulk-template.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerBulkTemplatePage() {
  return (
    <>
      <Head>
        <title>Seller Bulk Template — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-xl font-semibold">
              Seller bulk upload template
            </h1>

            <p className="mb-4 text-sm text-gray-600">
              To download the latest CSV template for bulk uploading listings,
              please use the controls below. The actual bulk upload workflow
              lives on the seller bulk upload page.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/seller/bulk-upload"
                className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Go to bulk upload
              </Link>

              <a
                href="/api/seller/bulk-template"
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-400"
              >
                Download CSV template
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
