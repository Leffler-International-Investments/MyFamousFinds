// FILE: /pages/management/content/homepage.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentHomepage() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((value, key) => {
      payload[key] = String(value);
    });

    try {
      const res = await fetch("/api/management/content/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage("Homepage content saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Homepage Content — Admin</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 text-gray-900">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Homepage Content</h1>
          <Link
            href="/management/content"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Hero Headline
            </label>
            <input
              name="heroTitle"
              defaultValue="Discover Curated Luxury Finds"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Hero Subheading
            </label>
            <textarea
              name="heroSubtitle"
              rows={2}
              defaultValue="Shop pre-loved designer treasures verified by experts."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Banner Image URL
            </label>
            <input
              name="heroImage"
              type="url"
              placeholder="https://cdn.famous-finds.com/banner.jpg"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Featured Collections (comma-separated)
            </label>
            <input
              name="collections"
              defaultValue="Bags,Watches,Jewelry,Clothing"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              SEO Description
            </label>
            <textarea
              name="seoDescription"
              rows={3}
              defaultValue="Famous-Finds: your destination for authenticated luxury resale."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          {message && <p className="text-xs text-green-700">{message}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
