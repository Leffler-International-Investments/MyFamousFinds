// FILE: /pages/management/developer.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ManagementDeveloper() {
  return (
    <>
      <Head>
        <title>Developer / Integrations — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Developer / Integrations
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                API keys, webhooks, and integration settings for partners.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <form className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Public API Key
              </label>
              <input
                type="text"
                placeholder="ff_public_..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Webhook Endpoint URL
              </label>
              <input
                type="url"
                placeholder="https://your-backend.com/webhooks/famous-finds"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Webhook Secret
              </label>
              <input
                type="password"
                placeholder="whsec_..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="sandbox-webhooks"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="sandbox-webhooks" className="text-xs text-gray-700">
                Enable sandbox webhooks for testing
              </label>
            </div>

            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Save Integration Settings
            </button>

            <p className="text-xs text-gray-500">
              Later you can connect this page to your real integration config storage.
            </p>
          </form>
        </main>
        <Footer />
      </div>
    </>
  );
}
