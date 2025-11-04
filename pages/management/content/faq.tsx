// FILE: /pages/management/content/faq.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

type FaqItem = { question: string; answer: string };

export default function ManagementContentFaq() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      question: "How do I sell on Famous-Finds?",
      answer: "Register as a seller and list your item for vetting.",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(index: number, field: keyof FaqItem, value: string) {
    const next = [...faqs];
    next[index][field] = value;
    setFaqs(next);
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/management/content/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ faqs }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage("FAQ updated.");
    } catch (err) {
      console.error(err);
      setError("Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>FAQ & Help Center — Admin</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 text-gray-900">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">FAQ & Help Center</h1>
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
          {faqs.map((f, i) => (
            <div key={i} className="rounded-md border border-gray-200 p-4">
              <label className="block text-xs font-medium text-gray-700">
                Question
              </label>
              <input
                value={f.question}
                onChange={(e) => handleChange(i, "question", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <label className="mt-3 block text-xs font-medium text-gray-700">
                Answer
              </label>
              <textarea
                value={f.answer}
                onChange={(e) => handleChange(i, "answer", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          ))}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={addFaq}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              + Add Question
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save FAQ"}
            </button>
          </div>

          {message && <p className="text-xs text-green-700">{message}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </main>
      <Footer />
    </>
  );
}
