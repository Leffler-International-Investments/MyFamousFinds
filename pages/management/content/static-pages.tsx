// FILE: /pages/management/content/static-pages.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentStaticPages() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const [page, setPage] = useState("about");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titles: Record<string, string> = {
    about: "About Us",
    contact: "Contact",
    shipping: "Shipping",
    returns: "Returns",
  };

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
      const res = await fetch(`/api/management/content/static-pages/${page}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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
              onClick={() => setPage(k)}
              className={`rounded-md border px-3 py-1 text-sm ${
                page === k
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {titles[k]}
            </button>
          ))}
        </div>

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
              defaultValue={titles[page]}
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
      </main>
      <Footer />
    </>
  );
}
