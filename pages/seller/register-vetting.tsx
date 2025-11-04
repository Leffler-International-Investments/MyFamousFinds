// FILE: /pages/seller/register-vetting.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerVetting() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>Become a Seller — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
        <p className="mt-2 text-sm text-gray-700">
          We partner with the best. To maintain the quality of our marketplace,
          all sellers are vetted. Please tell us about your business. Our team
          will review your application and respond within 2-3 business days.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Vetting form submitted for review!");
            // In a real app, this would send data to your backend
          }}
        >
          {/* Form fields */}
          <div>
            <label
              htmlFor="business_name"
              className="block text-sm font-medium text-gray-700"
            >
              Business Name
            </label>
            <input
              type="text"
              name="business_name"
              id="business_name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-gray-700"
            >
              Business Website or Social Media
            </label>
            <input
              type="url"
              name="website"
              id="website"
              placeholder="https://www.yourstore.com"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="inventory_source"
              className="block text-sm font-medium text-gray-700"
            >
              How do you source your inventory?
            </label>
            <textarea
              name="inventory_source"
              id="inventory_source"
              rows={3}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              e.g., "Direct from brands," "Authorized distributors," "Private
              collections," etc.
            </p>
          </div>

          <div>
            <label
              htmlFor="sample_products"
              className="block text-sm font-medium text-gray-700"
            >
              What brands or types of products do you sell?
            </label>
            <input
              type="text"
              name="sample_products"
              id="sample_products"
              placeholder="e.g., Chanel, Rolex, Hermès"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Application
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
