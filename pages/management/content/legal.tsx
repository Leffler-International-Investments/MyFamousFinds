// FILE: /pages/management/content/legal.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentLegal() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const [section, setSection] = useState("terms");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sections: Record<string, string> = {
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    cookies: "Cookies Policy",
    seller: "Seller Agreement",
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/management/content/legal/${section}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setSaving(false);
    setMessage("Section saved successfully.");
  }

  return (
    <>
      <Head>
        <title>Legal & Policies — Admin</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 text-gray-900">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Legal & Policies</h1>
          <Link href="/management/content" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
        </div>

        <div className="mb-4 flex gap-3">
          {Object.keys(sections).map((k) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`rounded-md border px-3 py-1 text-sm ${
                section === k ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {sections[k]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700">Section Title</label>
            <input
              name="title"
              defaultValue={sections[section]}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Content (HTML or Markdown)</label>
            <textarea
              name="body"
              rows={12}
              placeholder={`Write ${sections[section]} text here...`}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900"
            />
          </div>

          {message && <p className="text-xs text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Section"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
