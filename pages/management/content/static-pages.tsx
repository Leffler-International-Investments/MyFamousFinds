// FILE: /pages/management/content/static-pages.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

type PageContent = {
  title: string;
  body: string;
};

const titles: Record<string, string> = {
  about: "About Us",
  contact: "Contact",
  shipping: "Shipping",
  returns: "Returns",
};

export default function ManagementContentStaticPages() {
  const { loading: authLoading } = useRequireAdmin();
  const [pageKey, setPageKey] = useState("about");
  const [content, setContent] = useState<PageContent>({ title: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Load data when pageKey changes ---
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    
    fetch(`/api/management/content/static-pages/${pageKey}`)
      .then((res) => res.json())
      .then((data) => {
        setContent({
          title: data.content?.title || titles[pageKey],
          body: data.content?.body || "",
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load page data.");
        setContent({ title: titles[pageKey], body: "" });
      })
      .finally(() => setLoading(false));
  }, [authLoading, pageKey]);

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

  // --- UPDATED: Send state object ---
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/management/content/static-pages/${pageKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(content),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage("Page saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save page.");
    } finally {
      setSaving(false);
    }
  }
  
  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header /></div>;

  return (
    <>
      <Head>
        <title>Static Pages — Admin</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 text-gray-900">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Static Pages</h1>
          <Link
            href="/management/content"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>

        <div className="mb-4 flex gap-3">
          {Object.keys(titles).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setPageKey(k)}
              className={`rounded-md border px-3 py-1 text-sm ${
                pageKey === k
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {titles[k]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center p-8">Loading content...</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Page Title
              </label>
              <input
                name="title"
                value={content.title}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Page Content (HTML or Markdown)
              </label>
              <textarea
                name="body"
                rows={10}
                value={content.body}
                onChange={handleChange}
                placeholder="Write your page content here..."
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
              {saving ? "Saving…" : "Save Page"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
