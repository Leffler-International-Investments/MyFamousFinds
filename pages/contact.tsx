// FILE: /pages/contact.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <Head>
        <title>Contact – Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">Contact Us</h1>
          <p className="mt-3">
            Need help with a purchase, sale or account? Send us a message and
            we&apos;ll get back to you as soon as possible.
          </p>

          {sent ? (
            <div className="mt-6 rounded-lg border border-emerald-500/50 bg-emerald-900/20 p-4 text-xs text-emerald-200">
              Thank you – your message has been received (demo). We&apos;ll be in
              touch soon.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <input
                required
                name="name"
                placeholder="Your name"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email address"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
              />
              <textarea
                required
                name="message"
                placeholder="How can we help?"
                rows={4}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
              />
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100">
                Send message
              </button>
            </form>
          )}

          <div className="mt-6 text-xs text-gray-400">
            Or email us directly:{" "}
            <a href="mailto:support@famous-finds.com" className="underline">
              support@famous-finds.com
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
