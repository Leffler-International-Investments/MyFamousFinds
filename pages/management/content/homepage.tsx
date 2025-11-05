// FILE: /pages/management/content/homepage.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

type HomepageContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  collections: string;
  seoDescription: string;
};

const defaultContent: HomepageContent = {
  heroTitle: "Discover Curated Luxury Finds",
  heroSubtitle: "Shop pre-loved designer treasures verified by experts.",
  heroImage: "",
  collections: "Bags,Watches,Jewelry,Clothing",
  seoDescription: "Famous-Finds: your destination for authenticated luxury resale.",
};

export default function ManagementContentHomepage() {
  const { loading: authLoading } = useRequireAdmin();
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [loading, setLoading] = useState(true); // Page loading state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Load existing data ---
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetch("/api/management/content/homepage")
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setContent(data.content);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load homepage data.");
      })
      .finally(() => setLoading(false));
  }, [authLoading]);

  // --- NEW: Handle changes to controlled inputs ---
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setContent((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // --- UPDATED: Send state object instead of FormData ---
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/management/content/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(content), // Send the state object
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 text-center text-gray-900">
          Loading Content...
        </main>
      </div>
    );
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
              value={content.heroTitle}
              onChange={handleChange}
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
              value={content.heroSubtitle}
              onChange={handleChange}
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
              value={content.heroImage}
              onChange={handleChange}
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
              value={content.collections}
              onChange={handleChange}
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
              value={content.seoDescription}
              onChange={handleChange}
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
