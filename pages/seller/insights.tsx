// FILE: /pages/seller/insights.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";

type Insight = {
  brand: string;
  avgPrice: number;
  sellThrough: number;
  timeToSellDays: number;
  volume: number;
};

type Suggest = {
  suggested: number;
  low: number;
  high: number;
  confidence: number;
  comps: number;
};

export default function SellerInsights() {
  const [brand, setBrand] = useState("Gucci");
  const [category, setCategory] = useState("Bags");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [est, setEst] = useState<Suggest | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`/api/seller/insights`, { cache: "no-store" });
    const j = await r.json();
    setInsights(j.items || []);
  }

  async function estimate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((value, key) => {
      body[key] = String(value);
    });

    const r = await fetch(`/api/price-estimator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setEst(j);
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Head>
        <title>Seller — Insights | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Seller insights
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Brand performance, sell-through and a pricing estimator to help you
            choose the right price.
          </p>

          <section className="mt-6 grid gap-3 md:grid-cols-3">
            {insights.map((x) => (
              <div
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                key={x.brand}
              >
                <div className="text-sm font-semibold">{x.brand}</div>
                <div className="mt-2 text-xs text-gray-200">
                  Avg sold: ${x.avgPrice.toFixed(0)}
                </div>
                <div className="text-xs text-gray-200">
                  Sell-through: {(x.sellThrough * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-200">
                  Time to sell: {x.timeToSellDays} days
                </div>
                <div className="text-xs text-gray-200">
                  Volume (30d): {x.volume}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <h3 className="text-sm font-semibold text-white">
              Pricing estimator
            </h3>
            <form
              className="mt-4 grid gap-3 md:grid-cols-5"
              onSubmit={estimate}
            >
              <label className="flex flex-col gap-1 text-xs text-gray-200">
                Brand
                <input
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray-200">
                Category
                <input
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray-200">
                Condition
                <select
                  name="condition"
                  defaultValue="Excellent"
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                >
                  <option>New</option>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-gray-200">
                Original price (USD)
                <input
                  name="msrp"
                  type="number"
                  step="1"
                  placeholder="3000"
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                />
              </label>
              <div className="flex items-end">
                <button
                  className="w-full rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-gray-100"
                  disabled={busy}
                >
                  {busy ? "Estimating…" : "Estimate price"}
                </button>
              </div>
            </form>

            {est && (
              <div className="mt-4 rounded-lg border border-neutral-800 bg-black/40 p-3 text-xs text-gray-200">
                <div>
                  <b>Suggested:</b> ${est.suggested.toFixed(0)} (range $
                  {est.low.toFixed(0)} – ${est.high.toFixed(0)})
                </div>
                <div className="mt-1 text-gray-400">
                  <b>Confidence:</b> {(est.confidence * 100).toFixed(0)}% •{" "}
                  <b>Comparables:</b> {est.comps}
                </div>
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
