// FILE: /pages/sell.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState } from "react";

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Head>
        <title>Sell an Item – Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 text-sm text-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">Sell an item</h1>
          <p className="mt-3 text-gray-300">
            Send us details of a piece you&apos;d like to sell. Submissions are
            reviewed for authenticity, condition and fit with the Famous Finds
            marketplace.
          </p>

          {submitted && (
            <div className="mt-5 rounded-lg border border-emerald-500/50 bg-emerald-900/20 p-4 text-xs text-emerald-200">
              Thank you – your submission has been received (demo). In a
              production build, our team would review your item and follow up by
              email.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              required
              name="title"
              placeholder="Title (e.g. Gucci Marmont Mini Bag)"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <select
                name="category"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                defaultValue="Party Dresses"
              >
                <option>Party Dresses</option>
                <option>Bags</option>
                <option>Shoes</option>
                <option>Accessories</option>
                <option>Watches &amp; Jewelry</option>
              </select>

              <select
                name="condition"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                defaultValue="New"
              >
                <option>New</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
              </select>

              <input
                required
                name="price"
                type="number"
                min={0}
                step={1}
                placeholder="Price (USD)"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
              />
            </div>

            <input
              required
              name="imageUrl"
              placeholder="Image URL (https://...)"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
            />

            <textarea
              required
              name="description"
              rows={4}
              placeholder="Description (brand, size, colour, condition, inclusions...)"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
            />

            <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100">
              Submit for review
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400">
            Submissions are reviewed for US sale only. Payouts are made via
            Stripe Connect to a verified bank account once orders are delivered
            and any return window has passed.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
