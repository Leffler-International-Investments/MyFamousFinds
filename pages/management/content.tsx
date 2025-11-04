// FILE: /pages/management/content.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ManagementContent() {
  return (
    <>
      <Head>
        <title>Content Management — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Content Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Edit homepage sections, banners, static pages, FAQ, and legal policies.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Homepage</h2>
              <p className="mt-1 text-xs text-gray-600">
                Hero banners, featured collections, and SEO text.
              </p>
              <button className="mt-3 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black">
                Edit Homepage
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Static Pages</h2>
              <p className="mt-1 text-xs text-gray-600">
                About, Contact, Shipping, Returns, and more.
              </p>
              <button className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Manage Pages
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">FAQ & Help Center</h2>
              <p className="mt-1 text-xs text-gray-600">
                Common buyer and seller questions and answers.
              </p>
              <button className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Edit FAQ
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Legal & Policies</h2>
              <p className="mt-1 text-xs text-gray-600">
                Terms of Use, Privacy Policy, Cookies, and Seller Agreement.
              </p>
              <button className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                Manage Legal Content
              </button>
            </section>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can connect each card to a CMS (Headless, Firebase, or custom pages).
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
