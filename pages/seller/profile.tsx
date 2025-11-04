// FILE: /pages/seller/profile.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerProfile() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>Seller Profile — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Seller Profile
          </h1>
          <Link
            href="/seller/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Seller Dashboard
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Page Coming Soon
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This page will allow sellers to edit their business details,
            shipping settings, and financial (bank/tax) information.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
