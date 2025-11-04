// FILE: /pages/management/content.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementContent() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

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
              <Link
                href="/management/content/homepage"
                className="mt-3 inline-flex rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black"
              >
                Edit Homepage
              </Link>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Static Pages</h2>
              <p className="mt-1 text-xs text-gray-600">
                About, Contact, Shipping, Returns, and more.
              </p>
              <Link
                href="/management/content/static-pages"
                className="mt-3 inline-flex rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
              >
                Manage Pages
              </Link>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                FAQ &amp; Help Center
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Common buyer and seller questions and answers.
              </p>
              <Link
                href="/management/content/faq"
                className="mt-3 inline-flex rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
              >
                Edit FAQ
              </Link>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Legal &amp; Policies
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Terms of Use, Privacy Policy, Cookies, and Seller Agreement.
              </p>
              <Link
                href="/management/content/legal"
                className="mt-3 inline-flex rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
              >
                Manage Legal Content
              </Link>
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
